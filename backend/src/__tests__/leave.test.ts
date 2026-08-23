import { applyDoctorLeave, previewLeaveConflicts } from '../services/leave.service';
import { prisma } from '../utils/prisma';

describe('Doctor Leave Conflict Management & Auto-Cancellation', () => {
  let doctor: any;
  let patient: any;
  let appointment: any;
  const leaveDate = '2026-10-20';

  beforeAll(async () => {
    patient = await prisma.user.create({
      data: {
        name: 'Leave Test Patient',
        email: `leave_patient_${Date.now()}@cliniccare.com`,
        passwordHash: 'hashed',
        role: 'PATIENT',
      },
    });

    const docUser = await prisma.user.create({
      data: {
        name: 'Dr. Leave Test',
        email: `leave_doctor_${Date.now()}@cliniccare.com`,
        passwordHash: 'hashed',
        role: 'DOCTOR',
        doctorProfile: {
          create: {
            specialty: 'Neurology',
            consultationFee: 150,
          },
        },
      },
      include: { doctorProfile: true },
    });
    doctor = docUser.doctorProfile;

    appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        date: leaveDate,
        startTime: '10:00',
        endTime: '10:30',
        status: 'CONFIRMED',
        symptomsText: 'Chronic migraine review',
      },
    });
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await prisma.notificationLog.deleteMany({ where: { appointmentId: appointment.id } }).catch(() => {});
    await prisma.appointment.deleteMany({ where: { doctorId: doctor.id } }).catch(() => {});
    await prisma.doctorLeave.deleteMany({ where: { doctorId: doctor.id } }).catch(() => {});
    await prisma.doctorProfile.deleteMany({ where: { id: doctor.id } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [patient.id, doctor.userId] } } }).catch(() => {});
  });

  it('correctly previews conflicting patient bookings', async () => {
    const preview = await previewLeaveConflicts(doctor.id, leaveDate, leaveDate);
    expect(preview.count).toBe(1);
    expect(preview.appointments[0].id).toBe(appointment.id);
  });

  it('applies leave and cascades status to CANCELLED_DUE_TO_LEAVE', async () => {
    const result = await applyDoctorLeave({
      doctorId: doctor.id,
      startDate: leaveDate,
      endDate: leaveDate,
      reason: 'Medical Conference',
    });

    expect(result.affectedAppointmentsCount).toBe(1);

    const updated = await prisma.appointment.findUnique({
      where: { id: appointment.id },
    });

    expect(updated?.status).toBe('CANCELLED_DUE_TO_LEAVE');
    expect(updated?.cancellationReason).toContain('Medical Conference');
  });
});

