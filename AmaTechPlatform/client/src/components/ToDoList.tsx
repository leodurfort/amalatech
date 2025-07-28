import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Plus, Edit, Trash2, Save, X, Check, User, AlertCircle, CheckCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TodoTask, InsertTodoTask } from "@shared/schema";

interface ToDoListProps {
  dossierId: number;
}

export default function ToDoList({ dossierId }: ToDoListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    due_date: "",
    assigned_to: [] as string[],
    priority: "medium" as const
  });
  const [editingTask, setEditingTask] = useState({
    title: "",
    description: "",
    due_date: "",
    assigned_to: [] as string[],
    priority: "medium" as const
  });

  // Récupérer les utilisateurs réels depuis l'API
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  const teamMembers = users.map((user: any) => `${user.first_name} ${user.last_name}` || user.email);

  // Fetch todo tasks
  const { data: tasks = [], isLoading } = useQuery<TodoTask[]>({
    queryKey: [`/api/todos/${dossierId}`],
  });

  // Create todo task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: InsertTodoTask) => apiRequest("/api/todos", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/todos/${dossierId}`] });
      setNewTask({ title: "", description: "", due_date: "", assigned_to: [], priority: "medium" });
      setIsAddingTask(false);
      toast({
        title: "Tâche ajoutée",
        description: "La tâche a été ajoutée avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la tâche.",
        variant: "destructive",
      });
    },
  });

  // Update todo task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertTodoTask> }) =>
      apiRequest(`/api/todos/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/todos/${dossierId}`] });
      setEditingId(null);
      toast({
        title: "Tâche modifiée",
        description: "La tâche a été modifiée avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la tâche.",
        variant: "destructive",
      });
    },
  });

  // Delete todo task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/todos/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/todos/${dossierId}`] });
      toast({
        title: "Tâche supprimée",
        description: "La tâche a été supprimée avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche.",
        variant: "destructive",
      });
    },
  });

  const handleAddTask = () => {
    if (!newTask.title) {
      toast({
        title: "Champ requis",
        description: "Veuillez saisir un titre pour la tâche.",
        variant: "destructive",
      });
      return;
    }

    createTaskMutation.mutate({
      dossier_id: dossierId,
      title: newTask.title,
      description: newTask.description || null,
      due_date: newTask.due_date ? new Date(newTask.due_date) : null,
      assigned_to: newTask.assigned_to.length > 0 ? newTask.assigned_to : null,
      priority: newTask.priority,
    });
  };

  const handleEditTask = (task: TodoTask) => {
    setEditingId(task.id);
    setEditingTask({
      title: task.title,
      description: task.description || "",
      due_date: task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd") : "",
      assigned_to: Array.isArray(task.assigned_to) ? task.assigned_to : task.assigned_to ? [task.assigned_to] : [],
      priority: task.priority as "low" | "medium" | "high",
    });
  };

  const handleSaveEdit = () => {
    if (!editingTask.title) {
      toast({
        title: "Champ requis",
        description: "Veuillez saisir un titre pour la tâche.",
        variant: "destructive",
      });
      return;
    }

    updateTaskMutation.mutate({
      id: editingId!,
      data: {
        title: editingTask.title,
        description: editingTask.description || null,
        due_date: editingTask.due_date ? new Date(editingTask.due_date) : null,
        assigned_to: editingTask.assigned_to.length > 0 ? editingTask.assigned_to : null,
        priority: editingTask.priority,
      },
    });
  };

  const toggleDone = (taskId: number, currentDone: boolean) => {
    updateTaskMutation.mutate({
      id: taskId,
      data: { done: !currentDone },
    });
  };

  const removeTask = (taskId: number) => {
    deleteTaskMutation.mutate(taskId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return 'Moyenne';
    }
  };

  const getDueDateStatus = (dueDate?: string | Date) => {
    if (!dueDate) return 'none';
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 3) return 'soon';
    return 'normal';
  };

  const incompleteTasks = tasks.filter(task => !task.done);
  const completedTasks = tasks.filter(task => task.done);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#0e355c] mb-2">To-do List</h2>
            <p className="text-gray-600">Chargement des tâches...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0e355c] mb-2">To-do List</h2>
          <p className="text-gray-600">Gestion des tâches et actions pour ce mandat M&A</p>
        </div>
        <Button
          onClick={() => setIsAddingTask(true)}
          className="bg-[#0e355c] hover:bg-[#0e355c]/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      {/* Formulaire d'ajout */}
      {isAddingTask && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0e355c]">Nouvelle tâche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Titre *</label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Ex: Finaliser l'information pack"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Détails de la tâche..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Date d'échéance</label>
                  <Input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Assigné à (plusieurs personnes possibles)</label>
                  <div className="space-y-2">
                    {newTask.assigned_to.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {newTask.assigned_to.map(member => (
                          <Badge key={member} variant="secondary" className="flex items-center gap-1">
                            {member}
                            <X 
                              className="h-3 w-3 cursor-pointer hover:text-red-500" 
                              onClick={() => setNewTask({ 
                                ...newTask, 
                                assigned_to: newTask.assigned_to.filter(m => m !== member) 
                              })}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Select onValueChange={(value) => {
                      if (!newTask.assigned_to.includes(value)) {
                        setNewTask({ ...newTask, assigned_to: [...newTask.assigned_to, value] });
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Ajouter un membre" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.filter(member => !newTask.assigned_to.includes(member)).map(member => (
                          <SelectItem key={member} value={member}>{member}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Priorité</label>
                  <Select value={newTask.priority} onValueChange={(value: "low" | "medium" | "high") => setNewTask({ ...newTask, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddTask}
                  disabled={createTaskMutation.isPending}
                  className="bg-[#0e355c] hover:bg-[#0e355c]/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingTask(false);
                    setNewTask({ title: "", description: "", due_date: "", assigned_to: [], priority: "medium" });
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Circle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-2xl font-bold">{incompleteTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Terminées</p>
                <p className="text-2xl font-bold">{completedTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Urgentes</p>
                <p className="text-2xl font-bold">
                  {incompleteTasks.filter(t => t.priority === 'high').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des tâches en cours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#0e355c]">Tâches en cours ({incompleteTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {incompleteTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>Aucune tâche en cours</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incompleteTasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    checked={task.done}
                    onCheckedChange={() => toggleDone(task.id, task.done)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    {editingId === task.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editingTask.title}
                          onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                          placeholder="Titre de la tâche"
                        />
                        <Textarea
                          value={editingTask.description}
                          onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                          placeholder="Description"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <Input
                            type="date"
                            value={editingTask.due_date}
                            onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                          />
                          <div className="space-y-1">
                            {editingTask.assigned_to.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {editingTask.assigned_to.map(member => (
                                  <Badge key={member} variant="secondary" className="flex items-center gap-1 text-xs">
                                    {member}
                                    <X 
                                      className="h-2 w-2 cursor-pointer hover:text-red-500" 
                                      onClick={() => setEditingTask({ 
                                        ...editingTask, 
                                        assigned_to: editingTask.assigned_to.filter(m => m !== member) 
                                      })}
                                    />
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <Select onValueChange={(value) => {
                              if (!editingTask.assigned_to.includes(value)) {
                                setEditingTask({ ...editingTask, assigned_to: [...editingTask.assigned_to, value] });
                              }
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Ajouter membre" />
                              </SelectTrigger>
                              <SelectContent>
                                {teamMembers.filter(member => !editingTask.assigned_to.includes(member)).map(member => (
                                  <SelectItem key={member} value={member}>{member}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Select value={editingTask.priority} onValueChange={(value: "low" | "medium" | "high") => setEditingTask({ ...editingTask, priority: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Basse</SelectItem>
                              <SelectItem value="medium">Moyenne</SelectItem>
                              <SelectItem value="high">Haute</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEdit} disabled={updateTaskMutation.isPending}>
                            <Save className="h-4 w-4 mr-1" />
                            Sauver
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4 mr-1" />
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            {task.due_date && (
                              <div className={`flex items-center gap-1 ${
                                getDueDateStatus(task.due_date) === 'overdue' ? 'text-red-600' :
                                getDueDateStatus(task.due_date) === 'soon' ? 'text-orange-600' : ''
                              }`}>
                                <Calendar className="h-3 w-3" />
                                {new Date(task.due_date).toLocaleDateString("fr-FR")}
                              </div>
                            )}
                            {task.assigned_to && task.assigned_to.length > 0 && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {Array.isArray(task.assigned_to) 
                                  ? task.assigned_to.join(", ") 
                                  : task.assigned_to}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge className={getPriorityColor(task.priority)}>
                            {getPriorityLabel(task.priority)}
                          </Badge>
                          <Button
                            onClick={() => handleEditTask(task)}
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => removeTask(task.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tâches terminées */}
      {completedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0e355c]">Tâches terminées ({completedTasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedTasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50">
                  <Checkbox
                    checked={task.done}
                    onCheckedChange={() => toggleDone(task.id, task.done)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-600 line-through">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-500 mt-1 line-through">{task.description}</p>
                        )}
                      </div>
                      <Button
                        onClick={() => removeTask(task.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}