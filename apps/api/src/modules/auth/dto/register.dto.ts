import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

const phoneRegex = /^\+?\d{7,15}$/;

export const RegisterSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z
    .string()
    .min(8, 'Пароль должен быть минимум 8 символов')
    .regex(/[A-Z]/, 'Пароль должен содержать заглавную букву')
    .regex(/[a-z]/, 'Пароль должен содержать строчную букву')
    .regex(/[0-9]/, 'Пароль должен содержать цифру'),
  name: z.string().min(2, 'Имя должно быть минимум 2 символа'),
  phone: z.string().regex(phoneRegex, 'Некорректный формат телефона').optional(),
});

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'StrongPass123' })
  password: string;

  @ApiProperty({ example: 'Иван Петров' })
  name: string;

  @ApiProperty({ example: '+7 999 123-45-67', required: false })
  phone?: string;
}
