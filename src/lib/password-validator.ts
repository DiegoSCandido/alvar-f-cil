/**
 * Valida força de senha
 * Requerimentos:
 * - Mínimo 8 caracteres
 * - Pelo menos uma letra maiúscula
 * - Pelo menos uma letra minúscula
 * - Pelo menos um número
 * - Pelo menos um caracter especial
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Verificar comprimento
  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres');
  }

  // Verificar letra maiúscula
  if (!/[A-Z]/.test(password)) {
    errors.push('Pelo menos uma letra maiúscula (A-Z)');
  }

  // Verificar letra minúscula
  if (!/[a-z]/.test(password)) {
    errors.push('Pelo menos uma letra minúscula (a-z)');
  }

  // Verificar número
  if (!/[0-9]/.test(password)) {
    errors.push('Pelo menos um número (0-9)');
  }

  // Verificar caracter especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Pelo menos um caracter especial (!@#$%^&* etc)');
  }

  // Determinar força
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (errors.length === 0) {
    // Todos os requisitos atendidos
    if (password.length >= 12) {
      strength = 'strong';
    } else {
      strength = 'medium';
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'strong':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600';
    case 'weak':
      return 'text-red-600';
  }
}

export function getPasswordStrengthLabel(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'strong':
      return 'Forte';
    case 'medium':
      return 'Médio';
    case 'weak':
      return 'Fraco';
  }
}
