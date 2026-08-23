import {
  acquireSlotHold,
  bookAppointment,
  cleanupExpiredSlotHolds,
  getDoctorAvailableSlots,
} from '../services/booking.service';
import { prisma } from '../utils/prisma';

describe('Slot Calculation & Concurrency Double-Booking Protection', () => {
  let doctor: any;
  let patientA: any;
  let patientB: any;
  const testDate = '2026-09-15';

  beforeAll(async () => {
    patientA = await prisma.user.create({
      data: {
        name: 'Test Patient A',
        email: `testpatient_a_${Date.now()}@cliniccare.com`,
        passwordHash: 'hashed',
        role: 'PATIENT',
      },
    });

    patientB = await prisma.user.create({
      data: {
        name: 'Test Patient B',
        email: `testpatient_b_${Date.now()}@cliniccare.com`,
        passwordHash: 'hashed',
        role: 'PATIENT',
      },
    });

    const docUser = await prisma.user.create({
      data: {
        name: 'Dr. Concurrency Test',
        email: `testdoctor_${Date.now()}@cliniccare.com`,
        passwordHash: 'hashed',
        role: 'DOCTOR',
        doctorProfile: {
          create: {
            specialty: 'Cardiology',
            consultationFee: 100,
            slotDurationMinutes: 30,
            workingHours: JSON.stringify([
              {
                dayOfWeek: 2,
                dayName: 'Tuesday',
                startTime: '09:00',
                endTime: '12:00',
                isWorking: true,
                breaks: [{ startTime: '10:00', endTime: '10:30' }],
              },
            ]),
          },
        },
      },
      include: { doctorProfile: true },
    });

    doctor = docUser.doctorProfile;
  });

  afterAll(async () => {
    await prisma.slotHold.deleteMany({ where: { doctorId: doctor.id } });
    await prisma.appointment.deleteMany({ where: { doctorId: doctor.id } });
    await prisma.doctorProfile.deleteMany({ where: { id: doctor.id } });
    await prisma.user.deleteMany({ where: { id: { in: [patientA.id, patientB.id, doctor.userId] } } });
  });

  it('generates slots respecting working hours and excludes break intervals', async () => {
    const slots = await getDoctorAvailableSlots(doctor.id, testDate);
    expect(slots.length).toBe(5);

    const slotTimes = slots.map((s) => s.startTime);
    expect(slotTimes).toContain('09:00');
    expect(slotTimes).toContain('09:30');
    expect(slotTimes).not.toContain('10:00');
    expect(slotTimes).toContain('10:30');
    expect(slotTimes).toContain('11:00');
    expect(slotTimes).toContain('11:30');
  });

  it('allows Patient A to acquire a 5-minute hold on a slot', async () => {
    const hold = await acquireSlotHold(doctor.id, patientA.id, testDate, '09:00', '09:30');
    expect(hold.holdToken).toBeDefined();
    expect(hold.expiresAt.getTime()).toBeGreaterThan(Date.now());

    await expect(
      acquireSlotHold(doctor.id, patientB.id, testDate, '09:00', '09:30')
    ).rejects.toThrow();
  });

  it('prevents double-booking race condition under concurrent requests', async () => {
    const results = await Promise.allSettled([
      bookAppointment({
        doctorId: doctor.id,
        patientId: patientA.id,
        date: testDate,
        startTime: '11:00',
        endTime: '11:30',
        symptomsText: 'Patient A severe chest pain',
      }),
      bookAppointment({
        doctorId: doctor.id,
        patientId: patientB.id,
        date: testDate,
        startTime: '11:00',
        endTime: '11:30',
        symptomsText: 'Patient B migraine',
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
  });
});
