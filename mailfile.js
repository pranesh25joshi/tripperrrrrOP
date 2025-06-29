import { MailtrapClient } from "@mailtrap/mailtrap-client";

const TOKEN = "769bdedd730ca165576b58b44bb93fb4";

const client = new MailtrapClient({
  token: TOKEN,
});

const sender = {
  email: "hello@demomailtrap.co",
  name: "Mailtrap Test",
};
const recipients = [
  {
    email: "pranesh25joshi@gmail.com",
  }
];

client
  .send({
    from: sender, 
    to: recipients,
    subject: "You are awesome!",
    text: "Congrats for sending test email with Mailtrap!",
    category: "Integration Test",
  })
  .then(console.log, console.error);