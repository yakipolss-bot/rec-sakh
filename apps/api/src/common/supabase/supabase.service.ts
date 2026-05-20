import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';

interface SupabaseUser {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
  app_metadata: Record<string, unknown>;
  created_at: string;
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
}
