import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col px-4">
      {/* Header avec logo et titre */}
      <div className="flex items-center justify-between pt-8 pb-16 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <img
            src="/assets/logo-amala-bleu.png"
            alt="Logo Amala Partners"
            className="h-8"
          />
          <h1 className="text-4xl font-bold text-[#0e355c]">AmaTech</h1>
        </div>
      </div>

      {/* Contenu centré */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-[#0e355c] mb-6">
            AmaTech
          </h2>
          <p className="text-center text-gray-600 text-xl max-w-2xl mb-6 leading-relaxed">
            Espace de travail confidentiel dédié à la gestion des mandats d'Amala Partners.
          </p>
          <p className="text-center text-[#0e355c] font-medium text-lg italic mb-8">
            For a daring future
          </p>
          

        </div>

        {/* Bouton de connexion */}
        <div className="mb-16">
          <Button 
            className="bg-[#0e355c] hover:bg-[#0a2a45] text-white font-medium px-10 py-5 rounded-md text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            onClick={() => window.location.href = '/api/login'}
          >
            Accéder à la plateforme
          </Button>
        </div>

        {/* Section fonctionnalités */}
        <div className="w-full max-w-6xl mb-16">
          <h3 className="text-2xl font-semibold text-center text-[#0e355c] mb-8">
            Plateforme intégrée pour vos opérations M&A
          </h3>
          
          {/* Cartes modules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Carte 1 */}
            <div className="bg-white shadow-lg rounded-lg p-8 text-center border-l-4 border-[#0e355c] hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-[#0e355c] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <h2 className="text-xl font-semibold text-[#0e355c] mb-3">Gestion des Dossiers</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Accédez à l'ensemble des mandats en cours et naviguez dans un espace structuré par dossier.
              </p>
            </div>

            {/* Carte 2 */}
            <div className="bg-white shadow-lg rounded-lg p-8 text-center border-l-4 border-green-600 hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <h2 className="text-xl font-semibold text-green-700 mb-3">Suivi Roadshow</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Visualisez l'état des échanges avec les contreparties et pilotez les relances.
              </p>
            </div>

            {/* Carte 3 */}
            <div className="bg-white shadow-lg rounded-lg p-8 text-center border-l-4 border-purple-600 hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <h2 className="text-xl font-semibold text-purple-700 mb-3">CRM Interne</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Centralisez les contacts, suivez les interactions et facilitez le travail d'équipe.
              </p>
            </div>
          </div>
          
          {/* Section stats/benefits */}
          <div className="bg-gradient-to-r from-[#0e355c] to-[#1a4b73] rounded-xl p-8 text-white">
            <div className="text-center mb-6">
              <h4 className="text-xl font-semibold mb-2">Optimisez vos processus M&A</h4>
              <p className="text-blue-100">Une solution complète pour gérer efficacement vos mandats</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold mb-1">100%</div>
                <div className="text-sm text-blue-100">Confidentiel & Sécurisé</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">360°</div>
                <div className="text-sm text-blue-100">Vision Complète</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">24/7</div>
                <div className="text-sm text-blue-100">Accès Permanent</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pb-8">
        {/* Mention légale */}
        <p className="text-xs text-center text-gray-500 max-w-3xl mx-auto px-4 mb-4 leading-relaxed">
          L'accès à cette plateforme est strictement réservé aux employés d'Amala Partners.
          Tout accès non autorisé fera l'objet de poursuites conformément aux dispositions légales en vigueur.
        </p>

        {/* Copyright */}
        <p className="text-xs text-center text-gray-400">
          © {new Date().getFullYear()} Amala Partners. Plateforme interne confidentielle.
        </p>
      </div>
    </div>
  );
}