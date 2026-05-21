import { Injectable, UnauthorizedException } from '@nestjs/common';
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
