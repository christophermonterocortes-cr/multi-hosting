export type Language = 'en' | 'es';

export interface Translations {
  // Navigation & Sections
  navPlatform: string;
  navInfrastructure: string;
  navManagement: string;
  navTelemetry: string;
  navOverview: string;
  navProjects: string;
  navPortMatrix: string;
  navDatabases: string;
  navPhpMyAdmin: string;
  navUsers: string;
  navAudit: string;
  navSettings: string;
  navHealth: string;
  newProjectBtn: string;
  hostOnline: string;
  allocator: string;
  portRange: string;
  signOut: string;
  switchTheme: string;
  language: string;

  // Overview / Dashboard
  heroTitle: string;
  heroSubtitle: string;
  quickLaunchStatic: string;
  quickLaunchPhp: string;
  metricTotalProjects: string;
  metricActiveContainers: string;
  metricPortAllocation: string;
  metricDatabaseCount: string;
  metricCpuUsage: string;
  metricRamUsage: string;
  filterAll: string;
  filterLive: string;
  filterStatic: string;
  filterPhp: string;
  searchPlaceholder: string;
  noProjectsFound: string;
  noProjectsMatch: string;
  createFirstProject: string;

  // Project Card & Details
  statusRunning: string;
  statusStopped: string;
  statusError: string;
  statusProvisioning: string;
  runtimeStatic: string;
  runtimePhp: string;
  openSite: string;
  copyUrl: string;
  copied: string;
  manageProject: string;
  startContainer: string;
  stopContainer: string;
  restartContainer: string;
  deleteProject: string;
  deleteConfirm: string;
  filesTab: string;
  databaseTab: string;
  terminalLogsTab: string;
  settingsTab: string;
  livePreview: string;

  // File Manager
  uploadFiles: string;
  uploadZip: string;
  newFile: string;
  newFolder: string;
  dragDropTitle: string;
  dragDropSubtitle: string;
  saveChanges: string;
  saving: string;
  saved: string;
  deleteFile: string;
  fileName: string;
  fileSize: string;
  modifiedDate: string;
  actions: string;
  emptyFolder: string;

  // Database Tab
  databaseAttached: string;
  noDatabaseAttached: string;
  dbEngine: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  dbHost: string;
  dbPort: string;
  revealPassword: string;
  hidePassword: string;
  copyConnectionString: string;
  openPhpMyAdmin: string;
  tabPdo: string;
  tabCli: string;
  tabEnv: string;

  // Ports
  portsTitle: string;
  portsSubtitle: string;
  portNumber: string;
  portStatus: string;
  portProject: string;
  allocated: string;
  available: string;
  reserved: string;

  // Modals & Forms
  modalCreateTitle: string;
  modalCreateSubtitle: string;
  projectNameLabel: string;
  projectNamePlaceholder: string;
  runtimeLabel: string;
  attachDbLabel: string;
  attachDbDesc: string;
  dbEngineLabel: string;
  customDomainLabel: string;
  documentRootLabel: string;
  createBtn: string;
  cancelBtn: string;
  creating: string;

  // Auth
  signInTitle: string;
  signInSubtitle: string;
  registerTitle: string;
  registerSubtitle: string;
  usernameOrEmail: string;
  username: string;
  email: string;
  password: string;
  signInBtn: string;
  registerBtn: string;
  haveAccount: string;
  noAccount: string;
  createAccount: string;
  signInLink: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    navPlatform: 'PLATFORM',
    navInfrastructure: 'INFRASTRUCTURE',
    navManagement: 'MANAGEMENT',
    navTelemetry: 'TELEMETRY',
    navOverview: 'Overview',
    navProjects: 'Hosting Projects',
    navPortMatrix: 'Port Matrix',
    navDatabases: 'Databases',
    navPhpMyAdmin: 'phpMyAdmin',
    navUsers: 'User Accounts',
    navAudit: 'Audit Trail',
    navSettings: 'Configuration',
    navHealth: 'Node Health',
    newProjectBtn: 'New Hosting Project',
    hostOnline: 'Host Online',
    allocator: 'Allocator',
    portRange: 'Port Range',
    signOut: 'Sign Out',
    switchTheme: 'Toggle Theme',
    language: 'Language',

    heroTitle: 'Deploy and orchestrate isolated web projects in seconds',
    heroSubtitle: 'Automatic port assignment, dedicated databases, and live file editor with zero configuration.',
    quickLaunchStatic: 'Quick Deploy Static HTML',
    quickLaunchPhp: 'Quick Deploy PHP App',
    metricTotalProjects: 'Total Projects',
    metricActiveContainers: 'Active Containers',
    metricPortAllocation: 'Allocated Ports',
    metricDatabaseCount: 'Managed Databases',
    metricCpuUsage: 'Host CPU Load',
    metricRamUsage: 'Host RAM Usage',
    filterAll: 'All Projects',
    filterLive: 'Live Only',
    filterStatic: 'Static HTML/JS',
    filterPhp: 'PHP Dynamic',
    searchPlaceholder: 'Search projects by name, slug or port...',
    noProjectsFound: 'No hosting projects created yet.',
    noProjectsMatch: 'No projects match your active search filter.',
    createFirstProject: 'Create your first project to start hosting.',

    statusRunning: 'RUNNING',
    statusStopped: 'STOPPED',
    statusError: 'ERROR',
    statusProvisioning: 'PROVISIONING',
    runtimeStatic: 'Static HTML/JS',
    runtimePhp: 'PHP 8.2 Dynamic',
    openSite: 'Open Live Site',
    copyUrl: 'Copy Link',
    copied: 'Copied!',
    manageProject: 'Manage Site',
    startContainer: 'Start Site',
    stopContainer: 'Stop Site',
    restartContainer: 'Restart Site',
    deleteProject: 'Delete Project',
    deleteConfirm: 'Are you sure you want to permanently delete this project and release its port?',
    filesTab: 'File Manager',
    databaseTab: 'Database & SQL',
    terminalLogsTab: 'Live Logs',
    settingsTab: 'Settings',
    livePreview: 'Live Website View',

    uploadFiles: 'Upload Files',
    uploadZip: 'Upload ZIP Archive',
    newFile: 'New File',
    newFolder: 'New Folder',
    dragDropTitle: 'Drop files or folders here to upload',
    dragDropSubtitle: 'Supports HTML, PHP, CSS, JS, images and ZIP packages up to 100MB',
    saveChanges: 'Save File',
    saving: 'Saving...',
    saved: 'File saved successfully',
    deleteFile: 'Delete',
    fileName: 'Name',
    fileSize: 'Size',
    modifiedDate: 'Modified',
    actions: 'Actions',
    emptyFolder: 'This directory is empty.',

    databaseAttached: 'Attached Database Instance',
    noDatabaseAttached: 'No database attached to this project.',
    dbEngine: 'Engine',
    dbName: 'Database Name',
    dbUser: 'User',
    dbPassword: 'Password',
    dbHost: 'Host (Internal / LAN)',
    dbPort: 'Port',
    revealPassword: 'Show Password',
    hidePassword: 'Hide Password',
    copyConnectionString: 'Copy Connection String',
    openPhpMyAdmin: 'Open in phpMyAdmin',
    tabPdo: 'PHP PDO',
    tabCli: 'CLI / Shell',
    tabEnv: '.env Format',

    portsTitle: 'Port Allocation Matrix',
    portsSubtitle: 'Automated port assigner tracking allocated and free networking slots',
    portNumber: 'Port',
    portStatus: 'Status',
    portProject: 'Assigned Project',
    allocated: 'Allocated',
    available: 'Available',
    reserved: 'Reserved',

    modalCreateTitle: 'Launch New Project',
    modalCreateSubtitle: 'Configure your web runtime, automatic port assignment, and database.',
    projectNameLabel: 'Project Name',
    projectNamePlaceholder: 'e.g. My Portfolio or Store API',
    runtimeLabel: 'Runtime Engine',
    attachDbLabel: 'Attach Dedicated Database',
    attachDbDesc: 'Automatically create and link an isolated database instance with credentials',
    dbEngineLabel: 'Database Engine',
    customDomainLabel: 'Custom Domain (Optional)',
    documentRootLabel: 'Document Root Subdirectory (Optional)',
    createBtn: 'Deploy Project',
    cancelBtn: 'Cancel',
    creating: 'Deploying Container...',

    signInTitle: 'Sign In to Dashboard',
    signInSubtitle: 'Enter your administrative or user credentials to continue',
    registerTitle: 'Create an Account',
    registerSubtitle: 'Get instant access to automated port routing & databases',
    usernameOrEmail: 'Username or Email',
    username: 'Username',
    email: 'Email Address',
    password: 'Password',
    signInBtn: 'Sign In',
    registerBtn: 'Create Account',
    haveAccount: 'Already have an account?',
    noAccount: "Don't have an account?",
    createAccount: 'Create an account',
    signInLink: 'Sign in'
  },
  es: {
    navPlatform: 'PLATAFORMA',
    navInfrastructure: 'INFRAESTRUCTURA',
    navManagement: 'ADMINISTRACIÓN',
    navTelemetry: 'TELEMETRÍA',
    navOverview: 'Panel General',
    navProjects: 'Proyectos Web',
    navPortMatrix: 'Matriz de Puertos',
    navDatabases: 'Bases de Datos',
    navPhpMyAdmin: 'phpMyAdmin',
    navUsers: 'Cuentas de Usuario',
    navAudit: 'Registro de Auditoría',
    navSettings: 'Configuración',
    navHealth: 'Salud del Nodo',
    newProjectBtn: 'Nuevo Proyecto',
    hostOnline: 'Servidor En Línea',
    allocator: 'Asignador',
    portRange: 'Rango de Puertos',
    signOut: 'Cerrar Sesión',
    switchTheme: 'Cambiar Tema',
    language: 'Idioma',

    heroTitle: 'Despliega y administra proyectos web aislados en segundos',
    heroSubtitle: 'Asignación automática de puertos, bases de datos dedicadas y editor de archivos en vivo sin configuración.',
    quickLaunchStatic: 'Despliegue Rápido HTML Estático',
    quickLaunchPhp: 'Despliegue Rápido App PHP',
    metricTotalProjects: 'Proyectos Totales',
    metricActiveContainers: 'Contenedores Activos',
    metricPortAllocation: 'Puertos Asignados',
    metricDatabaseCount: 'Bases de Datos',
    metricCpuUsage: 'Uso de CPU Servidor',
    metricRamUsage: 'Uso de RAM Servidor',
    filterAll: 'Todos',
    filterLive: 'En Línea',
    filterStatic: 'HTML/JS Estático',
    filterPhp: 'PHP Dinámico',
    searchPlaceholder: 'Buscar proyectos por nombre, slug o puerto...',
    noProjectsFound: 'Aún no se han creado proyectos de alojamiento.',
    noProjectsMatch: 'Ningún proyecto coincide con el filtro de búsqueda.',
    createFirstProject: 'Crea tu primer proyecto para comenzar.',

    statusRunning: 'EN LÍNEA',
    statusStopped: 'DETENIDO',
    statusError: 'ERROR',
    statusProvisioning: 'CONFIGURANDO',
    runtimeStatic: 'HTML/JS Estático',
    runtimePhp: 'PHP 8.2 Dinámico',
    openSite: 'Abrir Sitio Web',
    copyUrl: 'Copiar Enlace',
    copied: '¡Copiado!',
    manageProject: 'Administrar Sitio',
    startContainer: 'Iniciar Sitio',
    stopContainer: 'Detener Sitio',
    restartContainer: 'Reiniciar Sitio',
    deleteProject: 'Eliminar Proyecto',
    deleteConfirm: '¿Estás seguro de que deseas eliminar permanentemente este proyecto y liberar su puerto?',
    filesTab: 'Gestor de Archivos',
    databaseTab: 'Base de Datos y SQL',
    terminalLogsTab: 'Registros en Vivo',
    settingsTab: 'Configuración',
    livePreview: 'Vista Previa en Vivo',

    uploadFiles: 'Subir Archivos',
    uploadZip: 'Subir Archivo ZIP',
    newFile: 'Nuevo Archivo',
    newFolder: 'Nueva Carpeta',
    dragDropTitle: 'Arrastra archivos o carpetas aquí para subir',
    dragDropSubtitle: 'Soporta HTML, PHP, CSS, JS, imágenes y paquetes ZIP de hasta 100MB',
    saveChanges: 'Guardar Archivo',
    saving: 'Guardando...',
    saved: 'Archivo guardado con éxito',
    deleteFile: 'Eliminar',
    fileName: 'Nombre',
    fileSize: 'Tamaño',
    modifiedDate: 'Modificado',
    actions: 'Acciones',
    emptyFolder: 'Este directorio está vacío.',

    databaseAttached: 'Instancia de Base de Datos Vinculada',
    noDatabaseAttached: 'No hay ninguna base de datos vinculada a este proyecto.',
    dbEngine: 'Motor',
    dbName: 'Nombre de Base de Datos',
    dbUser: 'Usuario',
    dbPassword: 'Contraseña',
    dbHost: 'Host (Red Local / LAN)',
    dbPort: 'Puerto',
    revealPassword: 'Ver Contraseña',
    hidePassword: 'Ocultar Contraseña',
    copyConnectionString: 'Copiar Cadena de Conexión',
    openPhpMyAdmin: 'Abrir en phpMyAdmin',
    tabPdo: 'PHP PDO',
    tabCli: 'CLI / Terminal',
    tabEnv: 'Formato .env',

    portsTitle: 'Matriz de Asignación de Puertos',
    portsSubtitle: 'Asignador automático de puertos con monitoreo de ranuras de red libres y en uso',
    portNumber: 'Puerto',
    portStatus: 'Estado',
    portProject: 'Proyecto Asignado',
    allocated: 'Asignado',
    available: 'Disponible',
    reserved: 'Reservado',

    modalCreateTitle: 'Lanzar Nuevo Proyecto',
    modalCreateSubtitle: 'Configura el entorno de ejecución, asignación automática de puerto y base de datos.',
    projectNameLabel: 'Nombre del Proyecto',
    projectNamePlaceholder: 'ej. Mi Portafolio o API de Tienda',
    runtimeLabel: 'Entorno de Ejecución',
    attachDbLabel: 'Vincular Base de Datos Dedicada',
    attachDbDesc: 'Crea y vincula automáticamente una base de datos aislada con credenciales seguras',
    dbEngineLabel: 'Motor de Base de Datos',
    customDomainLabel: 'Dominio Personalizado (Opcional)',
    documentRootLabel: 'Directorio Raíz (Opcional)',
    createBtn: 'Desplegar Proyecto',
    cancelBtn: 'Cancelar',
    creating: 'Desplegando Contenedor...',

    signInTitle: 'Iniciar Sesión en el Panel',
    signInSubtitle: 'Ingresa tus credenciales de administrador o usuario para continuar',
    registerTitle: 'Crear una Cuenta',
    registerSubtitle: 'Obtén acceso inmediato al enrutamiento automático de puertos y bases de datos',
    usernameOrEmail: 'Usuario o Correo Electrónico',
    username: 'Usuario',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    signInBtn: 'Iniciar Sesión',
    registerBtn: 'Crear Cuenta',
    haveAccount: '¿Ya tienes una cuenta?',
    noAccount: '¿No tienes una cuenta?',
    createAccount: 'Crear una cuenta',
    signInLink: 'Iniciar sesión'
  }
};
