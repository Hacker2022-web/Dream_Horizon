// Mock Firebase authentication and Firestore database using localStorage

export interface User {
  uid: string;
  email: string;
  emailVerified: boolean;
}

// Current user state
let currentUser: User | null = (() => {
  try {
    const stored = localStorage.getItem('dreamhorizon_admin_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
})();

export const auth = {
  get currentUser() {
    return currentUser;
  }
};

type AuthCallback = (user: User | null) => void;
const authListeners = new Set<AuthCallback>();

export const onAuthStateChanged = (authObj: typeof auth, callback: AuthCallback) => {
  authListeners.add(callback);
  callback(currentUser);
  return () => {
    authListeners.delete(callback);
  };
};

const notifyAuthListeners = () => {
  currentUser = (() => {
    try {
      const stored = localStorage.getItem('dreamhorizon_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();
  authListeners.forEach(cb => cb(currentUser));
};

export const loginWithEmail = async (email: string, password: string) => {
  // Simulating small network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  if (email === 'admin@gmail.com' && password === 'admin') {
    const user: User = {
      uid: 'admin-user-id',
      email: 'admin@gmail.com',
      emailVerified: true
    };
    localStorage.setItem('dreamhorizon_admin_user', JSON.stringify(user));
    notifyAuthListeners();
  } else {
    throw new Error('Invalid email or password');
  }
};

export const signOut = async (_authObj?: any) => {
  localStorage.removeItem('dreamhorizon_admin_user');
  notifyAuthListeners();
};

export const loginWithGoogle = async () => {
  alert('Google Login is not supported in offline local mode.');
};

// Projects management
export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  client?: string;
  year?: string;
  imageUrl: string;
  createdAt: number;
}

const base = (import.meta as any).env.BASE_URL || '/';
const getWorkUrl = (name: string) => `${base}work/${name}`;

const defaultProjects: Project[] = [
  { id: '1', category: 'Residential', title: 'The Cantilever House', description: 'A stunning architectural feat featuring a bold cantilevered concrete volume that floats effortlessly above a fully glazed ground storey. Clean lines and custom structural precision define this luxury estate.', imageUrl: getWorkUrl('download.png'), client: 'Private Estate', year: '2024', createdAt: Date.now() - 500000 },
  { id: '2', category: 'Commercial', title: 'Apex Commercial Pavilion', description: 'An innovative workspace designed for collaborative synergy. Features double-height timber ceilings, sustainable local stone accents, and custom structural glazing that floods the office with natural light.', imageUrl: getWorkUrl('download (1).png'), client: 'Vertex Holdings', year: '2025', createdAt: Date.now() - 400000 },
  { id: '3', category: 'Public', title: 'Symphony Concert Hall', description: 'A monumental civic landmark designed to enhance acoustic resonance and visual flow. Features sculptural wood panels, dramatic overhead skylights, and state-of-the-art spatial optimization.', imageUrl: getWorkUrl('download (2).png'), client: 'Municipal Culture Board', year: '2023', createdAt: Date.now() - 300000 },
  { id: '4', category: 'Hospitality', title: 'Zenith Luxury Resort', description: 'An immersive sanctuary nestled in natural topography. Features individual villas with private infinity pools, open-air pavilion dining, and premium sustainable material sourcing.', imageUrl: getWorkUrl('download (3).png'), client: 'Aero Hotels & Resorts', year: '2024', createdAt: Date.now() - 200000 },
  { id: '5', category: 'Commercial', title: 'The Pavilion Offices', description: 'A modern low-rise corporate headquarters blending interior and exterior spaces. Integrates landscaped sky gardens, smart automation systems, and custom steel-and-glass facades.', imageUrl: getWorkUrl('download (4).png'), client: 'TechStart Inc.', year: '2024', createdAt: Date.now() - 100000 }
];

export const getLocalProjects = (): Project[] => {
  const stored = localStorage.getItem('dreamhorizon_projects');
  // If stored has Unsplash images (meaning it is the old default set), let's clear it to update with the new work images!
  const hasOldDefaults = stored && stored.includes('unsplash.com');
  if (!stored || hasOldDefaults) {
    localStorage.setItem('dreamhorizon_projects', JSON.stringify(defaultProjects));
    return defaultProjects;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return defaultProjects;
  }
};

const saveLocalProjects = (projects: Project[]) => {
  localStorage.setItem('dreamhorizon_projects', JSON.stringify(projects));
};

type ProjectCallback = (projects: Project[]) => void;
const projectListeners = new Set<ProjectCallback>();

export const subscribeProjects = (callback: ProjectCallback) => {
  projectListeners.add(callback);
  callback(getLocalProjects());
  return () => {
    projectListeners.delete(callback);
  };
};

const notifyProjectListeners = () => {
  const projects = getLocalProjects();
  projectListeners.forEach(cb => cb(projects));
};

// Compress image before saving to fit within localStorage quota (5MB)
const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2D canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };
  });
};

// Convert image File to base64 DataURL with compression to prevent QuotaExceededError
const fileToDataUrl = (file: File): Promise<string> => {
  if (file.type.startsWith('image/')) {
    return compressImage(file);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const createProject = async (
  project: Omit<Project, 'id' | 'imageUrl' | 'createdAt'>,
  file: File
) => {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulating network
  const imageUrl = await fileToDataUrl(file);
  const projects = getLocalProjects();
  const newProject: Project = {
    ...project,
    id: Date.now().toString(),
    imageUrl,
    createdAt: Date.now()
  };
  projects.unshift(newProject);
  saveLocalProjects(projects);
  notifyProjectListeners();
};

export const updateProject = async (
  id: string,
  updates: Partial<Omit<Project, 'id' | 'imageUrl' | 'createdAt'>>,
  newFile?: File
) => {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulating network
  const projects = getLocalProjects();
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) throw new Error('Project not found');

  let imageUrl = projects[idx].imageUrl;
  if (newFile) {
    imageUrl = await fileToDataUrl(newFile);
  }

  projects[idx] = {
    ...projects[idx],
    ...updates,
    imageUrl
  };
  saveLocalProjects(projects);
  notifyProjectListeners();
};

export const deleteProject = async (id: string) => {
  const projects = getLocalProjects();
  const filtered = projects.filter(p => p.id !== id);
  saveLocalProjects(filtered);
  notifyProjectListeners();
};

// --- Team Management ---

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string; // Base64 or URL
  createdAt: number;
}

const defaultTeam: TeamMember[] = [
  {
    id: '1',
    name: 'Aarav Mehta',
    role: 'Principal Architect & Founder',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 400000
  },
  {
    id: '2',
    name: 'Meera Sen',
    role: 'Director of Interior Design',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 300000
  },
  {
    id: '3',
    name: 'Kabir Malhotra',
    role: 'Lead Structural Engineer',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 200000
  },
  {
    id: '4',
    name: 'Ananya Roy',
    role: 'BIM & Sustainability Lead',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 100000
  }
];

export const getLocalTeam = (): TeamMember[] => {
  const stored = localStorage.getItem('dreamhorizon_team');
  if (!stored) {
    localStorage.setItem('dreamhorizon_team', JSON.stringify(defaultTeam));
    return defaultTeam;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return defaultTeam;
  }
};

const saveLocalTeam = (team: TeamMember[]) => {
  localStorage.setItem('dreamhorizon_team', JSON.stringify(team));
};

type TeamCallback = (team: TeamMember[]) => void;
const teamListeners = new Set<TeamCallback>();

export const subscribeTeam = (callback: TeamCallback) => {
  teamListeners.add(callback);
  callback(getLocalTeam());
  return () => {
    teamListeners.delete(callback);
  };
};

const notifyTeamListeners = () => {
  const team = getLocalTeam();
  teamListeners.forEach(cb => cb(team));
};

export const createTeamMember = async (
  member: Omit<TeamMember, 'id' | 'image' | 'createdAt'>,
  file: File
) => {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulating network
  const image = await fileToDataUrl(file);
  const team = getLocalTeam();
  const newMember: TeamMember = {
    ...member,
    id: Date.now().toString(),
    image,
    createdAt: Date.now()
  };
  team.push(newMember);
  saveLocalTeam(team);
  notifyTeamListeners();
};

export const updateTeamMember = async (
  id: string,
  updates: Partial<Omit<TeamMember, 'id' | 'image' | 'createdAt'>>,
  newFile?: File
) => {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulating network
  const team = getLocalTeam();
  const idx = team.findIndex(m => m.id === id);
  if (idx === -1) throw new Error('Team member not found');

  let image = team[idx].image;
  if (newFile) {
    image = await fileToDataUrl(newFile);
  }

  team[idx] = {
    ...team[idx],
    ...updates,
    image
  };
  saveLocalTeam(team);
  notifyTeamListeners();
};

export const deleteTeamMember = async (id: string) => {
  const team = getLocalTeam();
  const filtered = team.filter(m => m.id !== id);
  saveLocalTeam(filtered);
  notifyTeamListeners();
};
