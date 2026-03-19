import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "fr" | "en";

const translations = {
  en: {
    // Nav
    dashboard: "Dashboard",
    customers: "Customers",
    transactions: "Transactions",
    terminals: "Terminals",
    reports: "Reports",
    reconciliation: "Reconciliation",
    endOfDay: "End of Day",
    invoices: "Invoices",

    // Common
    search: "Search",
    filter: "Filter",
    status: "Status",
    actions: "Actions",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    add: "Add",
    create: "Create",
    loading: "Loading...",
    noData: "No data",
    all: "All",
    active: "Active",
    inactive: "Inactive",
    date: "Date",
    amount: "Amount",
    name: "Name",
    email: "Email",
    phone: "Phone",
    address: "Address",
    total: "Total",
    export: "Export",
    close: "Close",
    back: "Back",
    confirm: "Confirm",

    // Dashboard
    totalRevenue: "Total Revenue",
    totalTransactions: "Total Transactions",
    successRate: "Success Rate",
    activeTerminals: "Active Terminals",
    recentActivity: "Recent Activity",
    overview: "Overview",

    // Transactions
    reference: "Reference",
    paymentMethod: "Payment Method",
    customer: "Customer",
    fulfilled: "Fulfilled",
    failed: "Failed",
    pending: "Pending",
    refunded: "Refunded",

    // Terminals
    serialNumber: "Serial Number",
    location: "Location",
    model: "Model",
    lastSeen: "Last Seen",

    // Customers
    properties: "Properties",
    users: "Users",
    addCustomer: "Add Customer",
    editCustomer: "Edit Customer",
    deleteCustomer: "Delete Customer",

    // Auth
    login: "Sign In",
    logout: "Sign Out",
    password: "Password",
    forgotPassword: "Forgot password?",
    mfaWarning: "MFA is disabled on your account. Enable it for better security.",
    enableMfa: "Enable MFA",

    // Reports
    revenue: "Revenue",
    count: "Count",
    daily: "Daily",
    monthly: "Monthly",
  },
  fr: {
    // Nav
    dashboard: "Tableau de bord",
    customers: "Clients",
    transactions: "Transactions",
    terminals: "Terminaux",
    reports: "Rapports",
    reconciliation: "Réconciliation",
    endOfDay: "Fin de journée",
    invoices: "Factures",

    // Common
    search: "Rechercher",
    filter: "Filtrer",
    status: "Statut",
    actions: "Actions",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    edit: "Modifier",
    view: "Voir",
    add: "Ajouter",
    create: "Créer",
    loading: "Chargement...",
    noData: "Aucune donnée",
    all: "Tous",
    active: "Actif",
    inactive: "Inactif",
    date: "Date",
    amount: "Montant",
    name: "Nom",
    email: "Email",
    phone: "Téléphone",
    address: "Adresse",
    total: "Total",
    export: "Exporter",
    close: "Fermer",
    back: "Retour",
    confirm: "Confirmer",

    // Dashboard
    totalRevenue: "Revenus totaux",
    totalTransactions: "Transactions totales",
    successRate: "Taux de succès",
    activeTerminals: "Terminaux actifs",
    recentActivity: "Activité récente",
    overview: "Vue d'ensemble",

    // Transactions
    reference: "Référence",
    paymentMethod: "Moyen de paiement",
    customer: "Client",
    fulfilled: "Réussi",
    failed: "Échoué",
    pending: "En attente",
    refunded: "Remboursé",

    // Terminals
    serialNumber: "Numéro de série",
    location: "Emplacement",
    model: "Modèle",
    lastSeen: "Dernière activité",

    // Customers
    properties: "Propriétés",
    users: "Utilisateurs",
    addCustomer: "Ajouter un client",
    editCustomer: "Modifier le client",
    deleteCustomer: "Supprimer le client",

    // Auth
    login: "Connexion",
    logout: "Déconnexion",
    password: "Mot de passe",
    forgotPassword: "Mot de passe oublié ?",
    mfaWarning: "Le MFA est désactivé sur votre compte. Activez-le pour plus de sécurité.",
    enableMfa: "Activer le MFA",

    // Reports
    revenue: "Revenus",
    count: "Nombre",
    daily: "Journalier",
    monthly: "Mensuel",
  },
};

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "fr",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem("sp_lang") as Lang) || "fr"
  );

  const setLang = (l: Lang) => {
    localStorage.setItem("sp_lang", l);
    setLangState(l);
  };

  const t = (key: TranslationKey): string => translations[lang][key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
