import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Engine } from '../src/engine.js';
import { MemoryStore } from '../src/store.js';
import { DEMO_USER_ID } from '../src/seed.js';
import { T, toneViolations } from '../src/tone.js';

const send = (method: string, body: unknown) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

async function setup() {
  const app = createApp(new Engine({ store: new MemoryStore() }), {});
  const post = async (path: string, body: unknown = {}, method = 'POST') =>
    (await app.request(path, method === 'GET' ? undefined : send(method, body))).json<any>();
  await post('/api/demo/reset');
  await post('/api/demo/clock', { preset: 'sunday-20' });
  return { app, post };
}

const u = `/api/users/${DEMO_USER_ID}`;

async function bookFirst(post: Awaited<ReturnType<typeof setup>>['post']) {
  const cap = await post(`${u}/weekly-capture`);
  const slot = cap.replies[0].buttons[0].action as string;
  return (await post(`${u}/messages`, { action: slot })).replies[0];
}

describe('plan por split', () => {
  it('asigna foco a la cita y el recordatorio lo nombra, sin ejercicios', async () => {
    const { post } = await setup();
    await post(`${u}/preferences`, { split: { id: 'ppl', sessions: 3 } }, 'PATCH');
    const reply = await bookFirst(post);
    const appt = (await post(`${u}/appointments`, {}, 'GET')).appointments.at(-1);
    expect(appt.focus).toMatchObject({ dayTypeId: 'push', label: 'Push', groups: ['pecho', 'hombros', 'triceps'] });
    expect(reply.text).toBeTruthy();

    await post('/api/demo/clock', { preset: 'monday-1830' });
    const rem = (await post(`${u}/reminder`)).replies[0].text as string;
    expect(rem).toContain('Hoy toca Push: pecho, hombros y tríceps');
    expect(toneViolations(rem)).toEqual([]);
    expect(rem).not.toMatch(/series|repeticiones|ejercicio/i);
  });

  it('rechaza una cantidad de sesiones que el split no ofrece', async () => {
    const { app } = await setup();
    const res = await app.request(`${u}/preferences`, send('PATCH', { split: { id: 'ppl', sessions: 4 } }));
    expect(res.status).toBe(400);
  });

  it('R4: con dolor no hay foco hasta que diga que ya lo conversó con un profesional', async () => {
    const { post } = await setup();
    await post(`${u}/preferences`, { split: { id: 'ppl', sessions: 3 } }, 'PATCH');
    await bookFirst(post);

    const pain = await post(`${u}/messages`, { text: 'me duele la rodilla' });
    expect(pain.replies[0].text).toMatch(/kinesiólogo/);
    let appts = (await post(`${u}/appointments`, {}, 'GET')).appointments;
    expect(appts.at(-1).focus).toBeUndefined();
    expect((await post(`${u}`, {}, 'GET')).user?.painPause).toBeTruthy();

    // mover la cita durante la pausa tampoco asigna foco
    await post(`${u}/move`);
    appts = (await post(`${u}/appointments`, {}, 'GET')).appointments;
    expect(appts.at(-1).focus).toBeUndefined();

    const back = await post(`${u}/messages`, { text: 'ya lo conversé con mi kinesiólogo' });
    expect(back.replies[0].text).toMatch(/Retomamos/);
    appts = (await post(`${u}/appointments`, {}, 'GET')).appointments;
    expect(appts.at(-1).focus?.dayTypeId).toBeTruthy();
  });
});

describe('nombre gogym', () => {
  it('el .ics y el saludo dicen gogym', async () => {
    const { app, post } = await setup();
    const reply = await bookFirst(post);
    const ics = await (await app.request(reply.attachment.url)).text();
    expect(ics).toContain('SUMMARY:Tu cita contigo · gogym');
    expect(ics).toContain('PRODID:-//gogym//');
    expect(T.start()).toContain('Soy gogym');
  });
});
