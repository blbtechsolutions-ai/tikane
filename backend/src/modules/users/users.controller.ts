import { Response } from 'express';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { usersService } from './users.service';
import { CreateClientDto, CreateAdminDto, UpdateProfileDto, ListUsersDto, UpdateUserStatusDto, UpdateKycStatusDto } from './users.dto';

export class UsersController {
  async getMe(req: AuthRequest, res: Response): Promise<void> {
    const user = await usersService.getProfile(req.user!.sub);
    res.json({ success: true, data: user });
  }

  async updateMe(req: AuthRequest, res: Response): Promise<void> {
    const dto = UpdateProfileDto.parse(req.body);
    const user = await usersService.updateProfile(req.user!.sub, dto);
    res.json({ success: true, message: 'Profil mis à jour', data: user });
  }

  async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    const stats = await usersService.getDashboardStats(req.user!.sub);
    res.json({ success: true, data: stats });
  }

  async createClient(req: AuthRequest, res: Response): Promise<void> {
    const dto = CreateClientDto.parse(req.body);
    const user = await usersService.createClient(dto, req.user!.sub);
    res.status(201).json({ success: true, message: 'Client créé', data: user });
  }

  async createAdmin(req: AuthRequest, res: Response): Promise<void> {
    const dto = CreateAdminDto.parse(req.body);
    const user = await usersService.createAdmin(dto, req.user!.sub);
    res.status(201).json({ success: true, message: 'Admin créé', data: user });
  }

  async updateKycStatus(req: AuthRequest, res: Response): Promise<void> {
    const dto = UpdateKycStatusDto.parse(req.body);
    const user = await usersService.updateKycStatus(req.params.id, dto, req.user!.sub);
    res.json({ success: true, message: 'KYC mis à jour', data: user });
  }

  // Admin only
  async listUsers(req: AuthRequest, res: Response): Promise<void> {
    const params = ListUsersDto.parse(req.query);
    const result = await usersService.listUsers(params, req.user!.role);
    res.json({ success: true, ...result });
  }

  async getUserById(req: AuthRequest, res: Response): Promise<void> {
    const user = await usersService.getProfile(req.params.id);
    res.json({ success: true, data: user });
  }

  async updateUserStatus(req: AuthRequest, res: Response): Promise<void> {
    const { status, reason } = UpdateUserStatusDto.parse(req.body);
    const user = await usersService.updateUserStatus(
      req.params.id,
      status,
      req.user!.sub,
      reason,
    );
    res.json({ success: true, message: 'Statut mis à jour', data: user });
  }

  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    await usersService.softDelete(req.params.id, req.user!.sub);
    res.json({ success: true, message: 'Utilisateur supprimé' });
  }

  async adminResetPassword(req: AuthRequest, res: Response): Promise<void> {
    const result = await usersService.adminResetUserPassword(req.params.id, req.user!.sub);
    res.json({ success: true, message: 'Lien de réinitialisation généré', data: result });
  }
}

export const usersController = new UsersController();
