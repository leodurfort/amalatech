import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  PlusIcon, 
  CalendarIcon, 
  UserIcon, 
  TrashIcon, 
  CheckCircleIcon,
  CircleIcon,
  AlertCircleIcon
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high';
  done: boolean;
  createdAt: string;
}

interface ToDoListProps {
  projectId?: number;
}

export default function ToDoList({ projectId }: ToDoListProps) {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Finaliser l'information pack",
      description: "Mise à jour des derniers éléments financiers et validation juridique",
      dueDate: "2025-01-30",
      assignedTo: "Sophie Martin",
      priority: "high",
      done: false,
      createdAt: "2025-01-15"
    },
    {
      id: "2", 
      title: "Contacter les acquéreurs prioritaires",
      description: "Premier contact pour le processus de vente",
      dueDate: "2025-02-05",
      assignedTo: "Thomas Dubois",
      priority: "medium",
      done: false,
      createdAt: "2025-01-16"
    },
    {
      id: "3",
      title: "Préparer la data room",
      description: "Organisation des documents pour la due diligence",
      dueDate: "2025-01-25",
      assignedTo: "Marie Durand",
      priority: "high",
      done: true,
      createdAt: "2025-01-10"
    }
  ]);

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    assignedTo: "",
    priority: "medium" as const
  });

  const teamMembers = [
    "Sophie Martin",
    "Thomas Dubois", 
    "Marie Durand",
    "Pierre Leroy",
    "Julie Bernard",
    "Antoine Moreau"
  ];

  const addTask = () => {
    if (!newTask.title) return;
    
    const task: Task = {
      id: crypto.randomUUID(),
      title: newTask.title,
      description: newTask.description || undefined,
      dueDate: newTask.dueDate || undefined,
      assignedTo: newTask.assignedTo || undefined,
      priority: newTask.priority,
      done: false,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setTasks([task, ...tasks]);
    setNewTask({
      title: "",
      description: "",
      dueDate: "",
      assignedTo: "",
      priority: "medium"
    });
    setIsAddingTask(false);
  };

  const toggleDone = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, done: !task.done } : task
    ));
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return priority;
    }
  };

  const getDueDateStatus = (dueDate?: string) => {
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
          <PlusIcon className="h-4 w-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CircleIcon className="h-5 w-5 text-orange-500" />
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
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
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
              <AlertCircleIcon className="h-5 w-5 text-red-500" />
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

      {/* Formulaire nouvelle tâche */}
      {isAddingTask && (
        <Card className="border-[#0e355c]/20">
          <CardHeader>
            <CardTitle className="text-lg text-[#0e355c]">Nouvelle tâche</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre de la tâche *
              </label>
              <Input
                placeholder="ex. Finaliser le mémorandum"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Textarea
                placeholder="Détails supplémentaires..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Échéance
                </label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigné à
                </label>
                <Select value={newTask.assignedTo} onValueChange={(value) => setNewTask({ ...newTask, assignedTo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map(member => (
                      <SelectItem key={member} value={member}>{member}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorité
                </label>
                <Select value={newTask.priority} onValueChange={(value: any) => setNewTask({ ...newTask, priority: value })}>
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
                onClick={addTask}
                disabled={!newTask.title}
                className="bg-[#0e355c] hover:bg-[#0e355c]/90"
              >
                Ajouter la tâche
              </Button>
              <Button
                onClick={() => {
                  setIsAddingTask(false);
                  setNewTask({ title: "", description: "", dueDate: "", assignedTo: "", priority: "medium" });
                }}
                variant="outline"
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des tâches en cours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#0e355c]">Tâches en cours ({incompleteTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {incompleteTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircleIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>Aucune tâche en cours</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incompleteTasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    checked={task.done}
                    onCheckedChange={() => toggleDone(task.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          {task.dueDate && (
                            <div className={`flex items-center gap-1 ${
                              getDueDateStatus(task.dueDate) === 'overdue' ? 'text-red-600' :
                              getDueDateStatus(task.dueDate) === 'soon' ? 'text-orange-600' : ''
                            }`}>
                              <CalendarIcon className="h-3 w-3" />
                              {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                            </div>
                          )}
                          {task.assignedTo && (
                            <div className="flex items-center gap-1">
                              <UserIcon className="h-3 w-3" />
                              {task.assignedTo}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge className={getPriorityColor(task.priority)}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        <Button
                          onClick={() => removeTask(task.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
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
                    onCheckedChange={() => toggleDone(task.id)}
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
                        <TrashIcon className="h-4 w-4" />
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