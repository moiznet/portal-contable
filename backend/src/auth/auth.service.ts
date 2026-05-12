// ============================================================
// auth.service.ts
// ============================================================
import { Injectable, UnauthorizedException, Inject, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
import { PG_POOL } from '../common/db.module';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService,@Inject(PG_POOL) private readonly pool: Pool) {}

  // BUG-01: El token incluye la password en el payload (leak de dato sensible)
  // El candidato debe identificar que el payload jamas debe incluir credenciales
  async login(email: string, password: string): Promise<{ access_token: string }> {
    // Validacion simulada — en produccion seria contra la DB

    // 1. Limpiamos el email y buscamos en la tabla 'usuarios'
    const emailLimpio = email.toLowerCase().trim();
    const sql = 'SELECT id, email, password_hash, rol FROM usuarios WHERE email = $1';
    
    try {
      const res = await this.pool.query(sql, [emailLimpio]);
      const usuario = res.rows[0];

    

      // 2. Verificación de existencia
      if (!usuario) {
        console.log(`[Auth] Intento fallido: El email ${emailLimpio} no existe.`);
        throw new UnauthorizedException('Credenciales incorrectas');
      }

      // 3. COMPARACIÓN DEFINITIVA
      // password: Lo que entra por el login ("test1234")
      // usuario.password_hash: El hash guardado ($2b$10$...)
      const esValida = await bcrypt.compare(password, usuario.password_hash.trim());

      if (!esValida) {
        console.log(`[Auth] Intento fallido: Password incorrecta para ${emailLimpio}`);
        throw new UnauthorizedException('Credenciales incorrectas');
      }

      // 4. GENERACIÓN DE TOKEN (Si llegamos aquí, todo es correcto)
      const payload = { 
        sub: usuario.id, 
        email: usuario.email,
        nombre: usuario.rol 
      };
      
      console.log(`[Auth] Login exitoso: ${usuario.email} , ${usuario.rol}`);

      return {
        access_token: this.jwtService.sign(payload) 
      };

    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      
      console.error('--- ERROR CRÍTICO EN AUTH ---');
      console.error(error);
      throw new Error('Error interno del servidor');
    }

    // if (email !== 'admin@daem.es' || password !== 'test1234') {
    //   throw new UnauthorizedException('Credenciales incorrectas');
    // }

    
  }
}
