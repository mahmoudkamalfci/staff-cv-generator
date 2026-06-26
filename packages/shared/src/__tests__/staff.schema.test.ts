import { CreateStaffSchema } from '../schemas/staff.js';

describe('CreateStaffSchema', () => {
  it('validates skills and participations arrays', () => {
    const data = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      jobTitle: 'Developer',
      yearsExperience: 5,
      summary: 'Summary',
      skills: [{ name: 'React', level: 'expert' }],
      participations: [{ projectId: 'uuid-1-not-valid', role: 'Dev', responsibilities: 'Coding' }]
    };
    // Should fail since projectId is not uuid, but let's make it a valid uuid for the test
    const validData = {
      ...data,
      participations: [{ projectId: 'b567d022-f611-45a1-ae4c-47ea52c6f372', role: 'Dev', responsibilities: 'Coding' }]
    };
    const result = CreateStaffSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty('skills');
      expect(result.data).toHaveProperty('participations');
    }
  });
});
