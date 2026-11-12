import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z.string().min(2, 'El nombre completo es obligatorio'),
  phone: z.string()
    .regex(/^\+?[0-9\s\-()]{6,15}$/, 'El formato del teléfono no es válido')
    .min(6, 'El teléfono es inválido'),
  address: z.string().min(3, 'La dirección es obligatoria'),
  city: z.string().min(2, 'La ciudad es obligatoria'),
  province: z.string().min(2, 'La provincia es obligatoria'),
  zip: z.string().min(4, 'El código postal no es válido')
});