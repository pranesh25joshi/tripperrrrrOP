import { Resend } from 'resend';

const resend = new Resend('re_BFsXezEz_PCqS2Qh24e3xnk6SQuVwvbCU');

await resend.emails.send({
  from: 'Pranesh <invitetrips@pranesh.xyz>',
  to: ['nimeshjoshi619@gmail.com'],
  subject: 'hello world',
  html: '<p>it works!</p>',
});