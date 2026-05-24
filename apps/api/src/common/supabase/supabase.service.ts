import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import axios from 'axios';

interface SupabaseUser {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
  app_metadata: Record<string, unknown>;
  created_at: string;
}

interface SupabaseTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: SupabaseUser;
}

@Injectable()
export class SupabaseService {
  private readonly supabaseUrl: string =
    process.env.SUPABASE_URL || 'https://fhdtteyrcczqlmvwjhps.supabase.co';

  // ─── TOKEN VERIFICATION ─────────────────────────────

  async verifyToken(token: string): Promise<SupabaseUser> {
    try {
      const { data, status } = await axios.get<SupabaseUser>(
        `${this.supabaseUrl}/auth/v1/user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: process.env.SUPABASE_ANON_KEY || '',
          },
          validateStatus: (s) => s < 500,
        },
      );

      if (status !== 200 || !data?.id) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      return data;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Token verification failed');
    }
  }

  // ─── LOGIN ──────────────────────────────────────────

  async signInWithPassword(email: string, password: string): Promise<SupabaseTokenResponse> {
    try {
      const { data, status } = await axios.post<SupabaseTokenResponse>(
        `${this.supabaseUrl}/auth/v1/token?grant_type=password`,
        { email, password },
        {
          headers: {
            apikey: process.env.SUPABASE_ANON_KEY || '',
            'Content-Type': 'application/json',
          },
          validateStatus: (s) => s < 500,
        },
      );

      if (status !== 200 || !data?.access_token) {
        throw new UnauthorizedException('Invalid email or password');
      }

      return data;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Login failed');
    }
  }

  // ─── SIGN UP ────────────────────────────────────────

  async signUp(
    email: string,
    password: string,
    options?: { data?: { name?: string } },
  ): Promise<SupabaseTokenResponse | { id: string; email: string }> {
    try {
      const { data, status } = await axios.post(
        `${this.supabaseUrl}/auth/v1/signup`,
        { email, password, options },
        {
          headers: {
            apikey: process.env.SUPABASE_ANON_KEY || '',
            'Content-Type': 'application/json',
          },
          validateStatus: (s) => s < 500,
        },
      );

      if (status !== 200 && status !== 201) {
        throw new BadRequestException(data?.msg || 'Registration failed');
      }

      return data;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Registration failed');
    }
  }

  // ─── LOGOUT ─────────────────────────────────────────

  async signOut(accessToken: string): Promise<void> {
    try {
      const { status } = await axios.post(
        `${this.supabaseUrl}/auth/v1/logout`,
        {},
        {
          headers: {
            apikey: process.env.SUPABASE_ANON_KEY || '',
            Authorization: `Bearer ${accessToken}`,
          },
          validateStatus: (s) => s < 500,
        },
      );

      if (status !== 204) {
        throw new UnauthorizedException('Logout failed');
      }
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Logout failed');
    }
  }

  // ─── PASSWORD MANAGEMENT ────────────────────────────

  async updatePassword(accessToken: string, newPassword: string): Promise<void> {
    try {
      await axios.put(
        `${this.supabaseUrl}/auth/v1/user`,
        { password: newPassword },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: process.env.SUPABASE_ANON_KEY || '',
            'Content-Type': 'application/json',
          },
          validateStatus: (s) => s < 500,
        },
      );
    } catch {
      throw new UnauthorizedException('Failed to update password');
    }
  }

  async resetPasswordForEmail(email: string): Promise<void> {
    try {
      const { status } = await axios.post(
        `${this.supabaseUrl}/auth/v1/recover`,
        { email },
        {
          headers: {
            apikey: process.env.SUPABASE_ANON_KEY || '',
            'Content-Type': 'application/json',
          },
          validateStatus: (s) => s < 500,
        },
      );

      if (status !== 200) {
        throw new BadRequestException('Failed to send recovery email');
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Failed to send recovery email');
    }
  }

  // ─── SMS OTP ────────────────────────────────────────

  async sendOtp(phone: string): Promise<void> {
    try {
      const { status } = await axios.post(
        `${this.supabaseUrl}/auth/v1/otp`,
        { phone, create_user: false },
        {
          headers: {
            apikey: process.env.SUPABASE_ANON_KEY || '',
            'Content-Type': 'application/json',
          },
          validateStatus: (s) => s < 500,
        },
      );

      if (status !== 200) {
        throw new BadRequestException('Failed to send SMS code');
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Failed to send SMS code');
    }
  }

  async verifyOtp(
    phone: string,
    token: string,
    type: string = 'sms',
  ): Promise<SupabaseTokenResponse | null> {
    try {
      const { data, status } = await axios.post<SupabaseTokenResponse>(
        `${this.supabaseUrl}/auth/v1/verify`,
        { phone, token, type },
        {
          headers: {
            apikey: process.env.SUPABASE_ANON_KEY || '',
            'Content-Type': 'application/json',
          },
          validateStatus: (s) => s < 500,
        },
      );

      if (status !== 200) {
        throw new BadRequestException('Invalid or expired code');
      }

      return data;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Verification failed');
    }
  }

  // ─── REFRESH TOKEN ──────────────────────────────────

  async refreshToken(refreshToken: string): Promise<SupabaseTokenResponse> {
    try {
      const { data, status } = await axios.post<SupabaseTokenResponse>(
        `${this.supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
        { refresh_token: refreshToken },
        {
          headers: {
            apikey: process.env.SUPABASE_ANON_KEY || '',
            'Content-Type': 'application/json',
          },
          validateStatus: (s) => s < 500,
        },
      );

      if (status !== 200 || !data?.access_token) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return data;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Token refresh failed');
    }
  }
}
