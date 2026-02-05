import { User, Project, FileMetadata } from "../types";

// BID-ZONE Backend API
const BASE_URL = 'https://bid-zone.onrender.com';

export class ApiService {
  // Simulate a network request delay (for auth/billing which are still mocked)
  private async simulateDelay(ms: number = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== REAL BID-ZONE API METHODS ====================

  /**
   * Upload construction document for AI processing
   */
  async uploadDocument(file: File, projectName: string): Promise<{
    success: boolean;
    project_name: string;
    result: any;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_name', projectName);

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get real-time estimate of currently processing project
   */
  async getCurrentEstimate(): Promise<{
    project_name: string;
    processing_stage: string;
    current_estimate: number;
    current_items: number;
    status: string;
    stages: any;
  } | null> {
    const response = await fetch(`${BASE_URL}/api/estimate/current`);
    
    if (response.status === 404) {
      return null; // No project currently processing
    }

    if (!response.ok) {
      throw new Error(`Failed to get estimate: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get system status and available agents
   */
  async getSystemStatus(): Promise<{
    system_status: string;
    agents_available: string[];
    projects_processed: number;
    current_project: string | null;
    timestamp: string;
  }> {
    const response = await fetch(`${BASE_URL}/api/status`);
    
    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get agent statistics
   */
  async getAgentStatistics(): Promise<{
    [key: string]: {
      agent_id: string;
      specialty: string;
      chunks_processed: number;
    };
  }> {
    const response = await fetch(`${BASE_URL}/api/agents`);
    
    if (!response.ok) {
      throw new Error(`Failed to get agents: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * List all processed projects
   */
  async listProjects(): Promise<{
    projects: Array<{
      name: string;
      path: string;
      files: string[];
    }>;
    count: number;
  }> {
    const response = await fetch(`${BASE_URL}/api/projects`);
    
    if (!response.ok) {
      throw new Error(`Failed to list projects: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Check backend health
   */
  async healthCheck(): Promise<{
    status: string;
    version: string;
    service: string;
  }> {
    const response = await fetch(`${BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // ==================== SIMULATED CLIENT-SIDE (Auth/Billing) ====================

  // AUTHENTICATION - SIMULATED CLIENT-SIDE
  async authenticate(email: string, pass: string, mode: 'signin' | 'signup', simulatePremium: boolean = false): Promise<User> {
    await this.simulateDelay(1500); // Simulate network latency

    let mockUser: User | null = null;
    const storedUser = localStorage.getItem('mockUser');

    if (storedUser) {
      mockUser = JSON.parse(storedUser);
      if (mockUser?.email !== email) { // Allow different emails to create new mock users
        mockUser = null;
      }
    }

    if (!mockUser) {
      // If no stored user or different email, create a new mock user
      mockUser = {
        id: `user_${Math.random().toString(36).substr(2, 9)}`,
        email: email,
        isSubscribed: simulatePremium,
        tier: simulatePremium ? 'PREMIUM' : 'BASIC',
        credits: simulatePremium ? 1000 : 100,
      };
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      console.log(`Simulated ${mode}: New user created or signed in as ${email}`);
    } else {
      // If user exists, just "sign in" and update premium status if requested
      mockUser.isSubscribed = simulatePremium;
      mockUser.tier = simulatePremium ? 'PREMIUM' : 'BASIC';
      mockUser.credits = simulatePremium ? 1000 : 100; // Reset credits for demo
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      console.log(`Simulated ${mode}: Signed in existing user ${email}`);
    }
    
    return mockUser;
  }

  async signOut(): Promise<void> {
    await this.simulateDelay(500); // Simulate network latency
    localStorage.removeItem('mockUser');
    console.log("Simulated Sign Out: User data cleared from localStorage");
  }

  // BILLING - SIMULATED CLIENT-SIDE
  async createStripeSession(): Promise<{ url: string }> {
    await this.simulateDelay(2000); // Simulate Stripe checkout redirect latency

    // In a real app, this would be a backend call to Stripe and return a real URL
    // For simulation, we'll just indicate a successful "upgrade" immediately
    const mockUser = JSON.parse(localStorage.getItem('mockUser') || '{}');
    if (mockUser) {
      mockUser.isSubscribed = true;
      mockUser.tier = 'PREMIUM';
      mockUser.credits += 1000; // Add some credits for premium
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
    }
    
    // Return a dummy URL, as the UI will handle the mock update
    return { url: window.location.origin + "/premium-success" }; 
  }

  async syncSubscriptionStatus(): Promise<Partial<User>> {
    await this.simulateDelay(500); // Simulate network latency

    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      const mockUser: User = JSON.parse(storedUser);
      return {
        isSubscribed: mockUser.isSubscribed,
        tier: mockUser.tier,
        credits: mockUser.credits,
      };
    }
    return { isSubscribed: false, tier: 'BASIC', credits: 0 };
  }

  // PERSISTENCE - Now using real BID-ZONE API
  async saveProject(project: Project): Promise<void> {
    await this.simulateDelay();
    console.log("Simulated Project Save:", project);
    // Backend doesn't have save endpoint yet - use localStorage for now
  }

  async fetchProjects(): Promise<Project[]> {
    // Use real API to get processed projects
    const projectsData = await this.listProjects();
    console.log("Real Projects from BID-ZONE:", projectsData);
    
    // Convert to Project format (simplified for now)
    return projectsData.projects.map(p => ({
      id: p.name,
      name: p.name,
      description: `${p.files.length} files`,
      nodes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  async deleteProject(id: string): Promise<void> {
    await this.simulateDelay();
    console.log("Simulated Delete Project:", id);
    // Backend doesn't have delete endpoint yet
  }
}

export const apiService = new ApiService();