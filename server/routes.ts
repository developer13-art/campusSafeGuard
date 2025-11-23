import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcryptjs";
import cookie from "cookie";
import signature from "cookie-signature";
import { storage } from "./storage";
import { pool } from "./db";
import { loginSchema, registerSchema, insertUserSchema, insertAlertSchema, updateAlertStatusSchema, insertChatSessionSchema, insertMessageSchema } from "@shared/schema";

// Session user type
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

// Middleware to check authentication
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Middleware to check role
function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    (req as any).user = user;
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server setup with session authentication
  const wss = new WebSocketServer({ noServer: true });
  
  // Store connected clients with user info
  const clients = new Map<string, Set<WebSocket>>();

  // Handle WebSocket upgrade with session validation
  httpServer.on('upgrade', async (req, socket, head) => {
    if (req.url !== '/ws') {
      return;
    }

    try {
      // Parse and verify session cookie
      const cookies = cookie.parse(req.headers.cookie || '');
      const sessionCookie = cookies['connect.sid'];
      
      if (!sessionCookie) {
        console.warn('WebSocket upgrade rejected: no session cookie');
        socket.destroy();
        return;
      }

      // Verify signed cookie using the same secret as express-session
      const sessionSecret = process.env.SESSION_SECRET;
      if (!sessionSecret) {
        console.error('SESSION_SECRET not configured');
        socket.destroy();
        return;
      }

      // Unsign the cookie to get the session ID and verify signature
      const sessionId = signature.unsign(sessionCookie.slice(2), sessionSecret);
      
      if (sessionId === false) {
        console.warn('WebSocket upgrade rejected: invalid session signature');
        socket.destroy();
        return;
      }

      // Query session from database
      const result = await pool.query(
        'SELECT sess FROM session WHERE sid = $1',
        [sessionId]
      );

      if (result.rows.length === 0 || !result.rows[0].sess?.userId) {
        console.warn('WebSocket upgrade rejected: invalid or expired session');
        socket.destroy();
        return;
      }

      const userId = result.rows[0].sess.userId;
      
      // Validate user exists
      const user = await storage.getUser(userId);
      if (!user) {
        console.warn('WebSocket upgrade rejected: user not found');
        socket.destroy();
        return;
      }

      // Upgrade to WebSocket with authenticated userId
      wss.handleUpgrade(req, socket, head, (ws) => {
        // Auto-register the authenticated user
        if (!clients.has(userId)) {
          clients.set(userId, new Set());
        }
        clients.get(userId)!.add(ws);
        console.log(`WebSocket authenticated for user ${userId}`);

        ws.on('close', () => {
          if (clients.has(userId)) {
            clients.get(userId)!.delete(ws);
            if (clients.get(userId)!.size === 0) {
              clients.delete(userId);
            }
          }
          console.log(`WebSocket disconnected for user ${userId}`);
        });

        wss.emit('connection', ws, req);
      });
    } catch (error) {
      console.error('WebSocket upgrade error:', error);
      socket.destroy();
    }
  });

  // Broadcast to specific user
  function broadcastToUser(userId: string, message: any) {
    const userClients = clients.get(userId);
    if (userClients) {
      const data = JSON.stringify(message);
      userClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    }
  }

  // Broadcast to all connected clients
  function broadcastToAll(message: any) {
    const data = JSON.stringify(message);
    clients.forEach((userClients) => {
      userClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    });
  }

  // ===== AUTHENTICATION ROUTES =====
  
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: "Account is inactive" });
      }

      await storage.updateUserLastLogin(user.id);
      req.session.userId = user.id;
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if email already exists
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Create student account
      const user = await storage.createUser({
        email: data.email,
        password: hashedPassword,
        role: "student",
        department: "none",
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        isActive: true,
      });

      // Auto-login the new user
      await storage.updateUserLastLogin(user.id);
      req.session.userId = user.id;
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  // ===== ALERT ROUTES =====

  app.post("/api/alerts", requireAuth, async (req: Request, res: Response) => {
    try {
      const data = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert({
        ...data,
        userId: req.session.userId!,
      });

      // Get department staff users and notify them
      try {
        const allUsers = await storage.getAllUsers();
        const staffUsers = allUsers.filter(u => u.role === "staff" && u.department === alert.department);

        // Broadcast to department staff via WebSocket
        staffUsers.forEach(staffUser => {
          if (staffUser && staffUser.id) {
            broadcastToUser(staffUser.id, {
              type: "new_alert",
              alertId: alert.id,
              department: alert.department,
              alert,
            });
          }
        });
      } catch (broadcastError) {
        console.error("Failed to broadcast alert:", broadcastError);
        // Don't fail the request if broadcast fails
      }

      res.json(alert);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create alert" });
    }
  });

  app.get("/api/alerts/my-alerts", requireAuth, async (req: Request, res: Response) => {
    try {
      const alerts = await storage.getAlertsByUser(req.session.userId!);
      res.json(alerts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/alerts/department/:department", requireRole("staff", "admin"), async (req: Request, res: Response) => {
    try {
      const { department } = req.params;
      const user = (req as any).user;
      
      // Staff can only see their department's alerts
      if (user.role === "staff" && user.department !== department) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const alerts = await storage.getAlertsByDepartment(department);
      res.json(alerts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/alerts/:id", requireRole("staff", "admin"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = updateAlertStatusSchema.parse(req.body);
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const alert = await storage.getAlert(id);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      // Staff can only update their department's alerts
      if (user.role === "staff" && user.department !== alert.department) {
        return res.status(403).json({ message: "Forbidden - can only manage your department's alerts" });
      }

      // Validate status transitions
      const validTransitions: Record<string, string[]> = {
        "pending": ["acknowledged", "dispatched"],
        "acknowledged": ["dispatched"],
        "dispatched": ["resolved"],
      };

      if (alert.status !== "pending" && validTransitions[alert.status] && !validTransitions[alert.status].includes(data.status)) {
        return res.status(400).json({ message: `Cannot transition from ${alert.status} to ${data.status}` });
      }

      const updateData: any = { status: data.status };
      if (data.responseNotes) {
        updateData.responseNotes = data.responseNotes;
      }

      if (data.status === "acknowledged") {
        updateData.acknowledgedAt = new Date();
        updateData.acknowledgedBy = user.id;
      } else if (data.status === "dispatched") {
        updateData.dispatchedAt = new Date();
      } else if (data.status === "resolved") {
        updateData.resolvedAt = new Date();
      }

      const updatedAlert = await storage.updateAlert(id, updateData);

      // Notify the student who created the alert
      try {
        if (alert.userId) {
          broadcastToUser(alert.userId, {
            type: "alert_updated",
            alertId: id,
            status: data.status,
          });
        }
      } catch (broadcastError) {
        console.error("Failed to broadcast alert update:", broadcastError);
      }

      res.json(updatedAlert);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update alert" });
    }
  });

  // ===== CHAT ROUTES =====

  app.post("/api/chats/sessions", requireAuth, async (req: Request, res: Response) => {
    try {
      const data = insertChatSessionSchema.parse(req.body);
      
      // Generate random anonymous ID
      const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const anonymousId = `User#${randomId}`;

      const session = await storage.createChatSession({
        ...data,
        userId: req.session.userId!,
        anonymousId,
      });

      res.json(session);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create chat session" });
    }
  });

  app.get("/api/chats/my-sessions", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessions = await storage.getChatSessionsByUser(req.session.userId!);
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/chats/sessions/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const session = await storage.getChatSession(id);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const user = (req as any).user || await storage.getUser(req.session.userId!);
      
      // Check access: student who owns it, staff from that department, or admin
      if (session.userId !== req.session.userId && 
          !(user.role === "staff" && user.department === session.department) &&
          user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(session);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/chats/department/:department", requireRole("staff", "admin"), async (req: Request, res: Response) => {
    try {
      const { department } = req.params;
      const user = (req as any).user;

      if (user.role === "staff" && user.department !== department) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const sessions = await storage.getChatSessionsByDepartment(department);
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/chats/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const data = insertMessageSchema.parse(req.body);
      const user = await storage.getUser(req.session.userId!);
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const session = await storage.getChatSession(data.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Check access
      const canAccess = session.userId === req.session.userId || 
                       (user.role === "staff" && user.department === session.department) ||
                       user.role === "admin";
      
      if (!canAccess) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const senderRole = user.role === "student" ? "student" : "staff";
      const message = await storage.createMessage({
        ...data,
        senderId: req.session.userId!,
        senderRole,
      });

      // Broadcast new message via WebSocket
      try {
        const allUsers = await storage.getAllUsers();
        
        // Notify student
        if (session.userId) {
          broadcastToUser(session.userId, {
            type: "chat_message",
            sessionId: session.id,
            message,
          });
        }

        // Notify staff from that department
        const staffUsers = allUsers.filter(u => u.role === "staff" && u.department === session.department);
        staffUsers.forEach(staffUser => {
          if (staffUser && staffUser.id) {
            broadcastToUser(staffUser.id, {
              type: "chat_message",
              sessionId: session.id,
              message,
            });
          }
        });
      } catch (broadcastError) {
        console.error("Failed to broadcast message:", broadcastError);
      }

      res.json(message);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to send message" });
    }
  });

  app.get("/api/chats/messages/:sessionId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getChatSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check access
      const canAccess = session.userId === req.session.userId || 
                       (user.role === "staff" && user.department === session.department) ||
                       user.role === "admin";
      
      if (!canAccess) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const messages = await storage.getMessagesBySession(sessionId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== ADMIN ROUTES =====

  app.get("/api/admin/stats", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const alerts = await storage.getAllAlerts();
      const chats = await storage.getAllChatSessions();

      const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length,
        totalAlerts: alerts.length,
        pendingAlerts: alerts.filter(a => a.status === "pending").length,
        totalChats: chats.length,
        activeChats: chats.filter(c => c.status === "active").length,
        avgResponseTime: "N/A", // Could calculate from acknowledgedAt - createdAt
        alertsByDepartment: {
          medical: alerts.filter(a => a.department === "medical").length,
          security: alerts.filter(a => a.department === "security").length,
        },
        alertsByStatus: {
          pending: alerts.filter(a => a.status === "pending").length,
          acknowledged: alerts.filter(a => a.status === "acknowledged").length,
          dispatched: alerts.filter(a => a.status === "dispatched").length,
          resolved: alerts.filter(a => a.status === "resolved").length,
        },
      };

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/users", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if email already exists
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      await storage.createAuditLog({
        userId: req.session.userId!,
        action: "create_user",
        targetType: "user",
        targetId: user.id,
        details: { email: user.email, role: user.role },
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create user" });
    }
  });

  app.delete("/api/admin/users/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (id === req.session.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.deleteUser(id);

      await storage.createAuditLog({
        userId: req.session.userId!,
        action: "delete_user",
        targetType: "user",
        targetId: id,
        details: { email: user.email },
      });

      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/alerts", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const alerts = await storage.getAllAlerts();
      res.json(alerts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/chats", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const chats = await storage.getAllChatSessions();
      res.json(chats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
