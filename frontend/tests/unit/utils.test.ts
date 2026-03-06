import { describe, it, expect } from 'vitest'
import { cn, formatCurrency, getInitials, generateInviteCode } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})

describe('formatCurrency', () => {
  it('formats euros', () => {
    const result = formatCurrency(12.5)
    expect(result).toContain('12')
    expect(result).toContain('50')
  })
})

describe('getInitials', () => {
  it('returns 2 initials from full name', () => {
    expect(getInitials('Alice Martin')).toBe('AM')
  })
  it('returns 1 initial for single name', () => {
    expect(getInitials('Alice')).toBe('A')
  })
  it('caps at 2 characters', () => {
    expect(getInitials('Alice Bob Charlie')).toBe('AB')
  })
})

describe('generateInviteCode', () => {
  it('generates a 6-character code', () => {
    const code = generateInviteCode()
    expect(code).toHaveLength(6)
    expect(code).toMatch(/^[A-Z0-9]+$/)
  })
  it('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateInviteCode()))
    expect(codes.size).toBeGreaterThan(90)
  })
})
