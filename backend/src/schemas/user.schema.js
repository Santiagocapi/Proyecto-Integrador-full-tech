
import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z.string().trim().min(2, 'El nombre completo es obligatorio'),

  phone: z.string()
    .trim()
    .regex(/^\+?[0-9\s()-]{6,15}$/, 'El formato del teléfono no es válido'),

  address: z.string().trim().min(3, 'La dirección es obligatoria'),

  city: z.string().trim().min(2, 'La ciudad es obligatoria'),

  province: z.string().trim().min(2, 'La provincia es obligatoria'),

  zip: z.string().trim().min(4, 'El código postal no es válido')
});
