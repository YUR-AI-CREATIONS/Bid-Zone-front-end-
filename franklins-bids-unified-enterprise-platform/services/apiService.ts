import { User, Project, FileMetadata } from "../types";

// Change this to your actual backend URL (e.g., https://api.yur.ai)
const BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';

export class ApiService {
  // Simulate a network request delay
  private async simulateDelay(ms: number = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

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

  // PERSISTENCE - Placeholder, not fully implemented client-side
  async saveProject(project: Project): Promise<void> {
    await this.simulateDelay();
    console.log("Simulated Project Save:", project);
    // In a real app, this would interact with a backend database
  }

  async fetchProjects(): Promise<Project[]> {
    await this.simulateDelay();
    console.log("Simulated Fetch Projects");
    return []; // Return empty for now
  }

  async deleteProject(id: string): Promise<void> {
    await this.simulateDelay();
    console.log("Simulated Delete Project:", id);
  }
}

export const apiService = new ApiService();