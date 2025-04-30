
import { 
  type User, 
  type InsertUser,
  type Leave,
  type InsertLeave,
  type Mission,
  type InsertMission,
  type WorkHours,
  type InsertWorkHours,
  type Internship,
  type InsertInternship,
  type JobApplication,
  type InsertJobApplication
} from "../../shared/schema";

// Define a comprehensive storage interface for all HR operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Leave operations
  getLeave(id: number): Promise<Leave | undefined>;
  getLeavesByUser(userId: number): Promise<Leave[]>;
  getAllLeaves(): Promise<Leave[]>;
  createLeave(leave: InsertLeave): Promise<Leave>;
  updateLeave(id: number, leaveData: Partial<Leave>): Promise<Leave | undefined>;
  approveLeave(id: number): Promise<Leave | undefined>;
  rejectLeave(id: number): Promise<Leave | undefined>;
  
  // Mission operations
  getMission(id: number): Promise<Mission | undefined>;
  getMissionsByAssignee(userId: number): Promise<Mission[]>;
  getMissionsBySupervisor(userId: number): Promise<Mission[]>;
  getAllMissions(): Promise<Mission[]>;
  createMission(mission: InsertMission): Promise<Mission>;
  updateMission(id: number, missionData: Partial<Mission>): Promise<Mission | undefined>;
  completeMission(id: number): Promise<Mission | undefined>;
  
  // Work Hours operations
  getWorkHoursByUser(userId: number): Promise<WorkHours[]>;
  getAllWorkHours(): Promise<WorkHours[]>;
  createWorkHours(workHours: InsertWorkHours): Promise<WorkHours>;
  
  // Internship operations
  getInternship(id: number): Promise<Internship | undefined>;
  getInternshipsByIntern(userId: number): Promise<Internship[]>;
  getInternshipsBySupervisor(userId: number): Promise<Internship[]>;
  getAllInternships(): Promise<Internship[]>;
  createInternship(internship: InsertInternship): Promise<Internship>;
  updateInternship(id: number, internshipData: Partial<Internship>): Promise<Internship | undefined>;
  changeInternshipStatus(id: number, status: string): Promise<Internship | undefined>;
  
  // Job Application operations
  getJobApplication(id: number): Promise<JobApplication | undefined>;
  getJobApplicationsByUser(userId: number): Promise<JobApplication[]>;
  getAllJobApplications(): Promise<JobApplication[]>;
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateJobApplication(id: number, applicationData: Partial<JobApplication>): Promise<JobApplication | undefined>;
  approveJobApplication(id: number): Promise<JobApplication | undefined>;
  rejectJobApplication(id: number): Promise<JobApplication | undefined>;
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private leaves: Map<number, Leave>;
  private missions: Map<number, Mission>;
  private workHours: Map<number, WorkHours>;
  private internships: Map<number, Internship>;
  private jobApplications: Map<number, JobApplication>;
  
  private userIdCounter: number;
  private leaveIdCounter: number;
  private missionIdCounter: number;
  private workHoursIdCounter: number;
  private internshipIdCounter: number;
  private jobApplicationIdCounter: number;

  constructor() {
    this.users = new Map();
    this.leaves = new Map();
    this.missions = new Map();
    this.workHours = new Map();
    this.internships = new Map();
    this.jobApplications = new Map();
    
    this.userIdCounter = 1;
    this.leaveIdCounter = 1;
    this.missionIdCounter = 1;
    this.workHoursIdCounter = 1;
    this.internshipIdCounter = 1;
    this.jobApplicationIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      leave_balance: insertUser.leave_balance || '30',
      user_type: insertUser.user_type || 'employee'
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Leave operations
  async getLeave(id: number): Promise<Leave | undefined> {
    return this.leaves.get(id);
  }

  async getLeavesByUser(userId: number): Promise<Leave[]> {
    return Array.from(this.leaves.values()).filter(
      (leave) => leave.user_id === userId,
    );
  }

  async getAllLeaves(): Promise<Leave[]> {
    return Array.from(this.leaves.values());
  }

  async createLeave(insertLeave: InsertLeave): Promise<Leave> {
    const id = this.leaveIdCounter++;
    const now = new Date().toISOString();
    const leave: Leave = { 
      ...insertLeave, 
      id, 
      created_at: new Date(now),
      status: 'pending',
      user_name: 'User Name' // Would be populated from user data in real implementation
    };
    this.leaves.set(id, leave);
    return leave;
  }

  async updateLeave(id: number, leaveData: Partial<Leave>): Promise<Leave | undefined> {
    const leave = this.leaves.get(id);
    if (!leave) return undefined;
    
    const updatedLeave = { ...leave, ...leaveData };
    this.leaves.set(id, updatedLeave);
    return updatedLeave;
  }

  async approveLeave(id: number): Promise<Leave | undefined> {
    const leave = this.leaves.get(id);
    if (!leave) return undefined;
    
    const updatedLeave = { ...leave, status: 'approved' };
    this.leaves.set(id, updatedLeave);
    
    // Update user leave balance
    const user = this.users.get(leave.user_id);
    if (user) {
      const startDate = new Date(leave.start_date);
      const endDate = new Date(leave.end_date);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const updatedUser = { 
        ...user, 
        leave_balance: Math.max(0, Number(user.leave_balance) - daysDiff).toString() 
      };
      this.users.set(user.id, updatedUser);
    }
    
    return updatedLeave;
  }

  async rejectLeave(id: number): Promise<Leave | undefined> {
    const leave = this.leaves.get(id);
    if (!leave) return undefined;
    
    const updatedLeave = { ...leave, status: 'rejected' };
    this.leaves.set(id, updatedLeave);
    return updatedLeave;
  }

  // Mission operations
  async getMission(id: number): Promise<Mission | undefined> {
    return this.missions.get(id);
  }

  async getMissionsByAssignee(userId: number): Promise<Mission[]> {
    return Array.from(this.missions.values()).filter(
      (mission) => mission.assigned_to_id === userId,
    );
  }

  async getMissionsBySupervisor(userId: number): Promise<Mission[]> {
    return Array.from(this.missions.values()).filter(
      (mission) => mission.supervisor_id === userId,
    );
  }

  async getAllMissions(): Promise<Mission[]> {
    return Array.from(this.missions.values());
  }

  async createMission(insertMission: InsertMission): Promise<Mission> {
    const id = this.missionIdCounter++;
    const now = new Date().toISOString();
    const mission: Mission = { 
      ...insertMission, 
      id, 
      created_at: new Date(now),
      completed: false,
      assigned_to_name: 'Assignee Name', // Would be populated from user data in real implementation
      supervisor_name: 'Supervisor Name' // Would be populated from user data in real implementation
    };
    this.missions.set(id, mission);
    return mission;
  }

  async updateMission(id: number, missionData: Partial<Mission>): Promise<Mission | undefined> {
    const mission = this.missions.get(id);
    if (!mission) return undefined;
    
    const updatedMission = { ...mission, ...missionData };
    this.missions.set(id, updatedMission);
    return updatedMission;
  }

  async completeMission(id: number): Promise<Mission | undefined> {
    const mission = this.missions.get(id);
    if (!mission) return undefined;
    
    const updatedMission = { ...mission, completed: true };
    this.missions.set(id, updatedMission);
    return updatedMission;
  }

  // Work Hours operations
  async getWorkHoursByUser(userId: number): Promise<WorkHours[]> {
    return Array.from(this.workHours.values()).filter(
      (workHours) => workHours.user_id === userId,
    );
  }

  async getAllWorkHours(): Promise<WorkHours[]> {
    return Array.from(this.workHours.values());
  }

  async createWorkHours(insertWorkHours: InsertWorkHours): Promise<WorkHours> {
    const id = this.workHoursIdCounter++;
    const now = new Date().toISOString();
    const workHours: WorkHours = { 
      ...insertWorkHours, 
      id, 
      created_at: new Date(now),
      user_name: 'User Name' // Would be populated from user data in real implementation
    };
    this.workHours.set(id, workHours);
    return workHours;
  }

  // Internship operations
  async getInternship(id: number): Promise<Internship | undefined> {
    return this.internships.get(id);
  }

  async getInternshipsByIntern(userId: number): Promise<Internship[]> {
    return Array.from(this.internships.values()).filter(
      (internship) => internship.intern_id === userId,
    );
  }

  async getInternshipsBySupervisor(userId: number): Promise<Internship[]> {
    return Array.from(this.internships.values()).filter(
      (internship) => internship.supervisor_id === userId,
    );
  }

  async getAllInternships(): Promise<Internship[]> {
    return Array.from(this.internships.values());
  }

  async createInternship(insertInternship: InsertInternship): Promise<Internship> {
    const id = this.internshipIdCounter++;
    const now = new Date().toISOString();
    const internship: Internship = { 
      ...insertInternship, 
      id, 
      created_at: new Date(now),
      status: 'pending',
      intern_name: 'Intern Name', // Would be populated from user data in real implementation
      supervisor_name: 'Supervisor Name' // Would be populated from user data in real implementation
    };
    this.internships.set(id, internship);
    return internship;
  }

  async updateInternship(id: number, internshipData: Partial<Internship>): Promise<Internship | undefined> {
    const internship = this.internships.get(id);
    if (!internship) return undefined;
    
    const updatedInternship = { ...internship, ...internshipData };
    this.internships.set(id, updatedInternship);
    return updatedInternship;
  }

  async changeInternshipStatus(id: number, status: string): Promise<Internship | undefined> {
    const internship = this.internships.get(id);
    if (!internship) return undefined;
    
    const updatedInternship = { ...internship, status };
    this.internships.set(id, updatedInternship);
    return updatedInternship;
  }

  // Job Application operations
  async getJobApplication(id: number): Promise<JobApplication | undefined> {
    return this.jobApplications.get(id);
  }

  async getJobApplicationsByUser(userId: number): Promise<JobApplication[]> {
    return Array.from(this.jobApplications.values()).filter(
      (application) => application.user_id === userId,
    );
  }

  async getAllJobApplications(): Promise<JobApplication[]> {
    return Array.from(this.jobApplications.values());
  }

  async createJobApplication(insertApplication: InsertJobApplication): Promise<JobApplication> {
    const id = this.jobApplicationIdCounter++;
    const now = new Date().toISOString();
    const application: JobApplication = { 
      ...insertApplication, 
      id, 
      created_at: new Date(now),
      status: 'pending',
      user_id: insertApplication.user_id ?? null
    };
    this.jobApplications.set(id, application);
    return application;
  }

  async updateJobApplication(id: number, applicationData: Partial<JobApplication>): Promise<JobApplication | undefined> {
    const application = this.jobApplications.get(id);
    if (!application) return undefined;
    
    const updatedApplication = { ...application, ...applicationData };
    this.jobApplications.set(id, updatedApplication);
    return updatedApplication;
  }

  async approveJobApplication(id: number): Promise<JobApplication | undefined> {
    const application = this.jobApplications.get(id);
    if (!application) return undefined;
    
    const updatedApplication = { ...application, status: 'approved' };
    this.jobApplications.set(id, updatedApplication);
    return updatedApplication;
  }

  async rejectJobApplication(id: number): Promise<JobApplication | undefined> {
    const application = this.jobApplications.get(id);
    if (!application) return undefined;
    
    const updatedApplication = { ...application, status: 'rejected' };
    this.jobApplications.set(id, updatedApplication);
    return updatedApplication;
  }
}

// Create and export a storage instance
export const storage = new MemStorage();
