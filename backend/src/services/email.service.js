import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

export function emailEnabled() {
  return env.mailEnabled && Boolean(env.smtpHost) && Boolean(env.smtpUser) && Boolean(env.smtpPass);
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: { user: env.smtpUser, pass: env.smtpPass },
    });
  }
  return transporter;
}

const money = (n) => `${new Intl.NumberFormat('fr-FR').format(Math.round((n || 0) / 100))} FCFA`;

function layout(title, body) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f5f5f7;padding:24px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            <div style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
              <div style="background:#0f766e;padding:20px 24px">
                <span style="color:#ffffff;font-size:20px;font-weight:bold">DKmarket</span>
              </div>
              <div style="padding:24px">
                <h1 style="font-size:18px;color:#111827;margin:0 0 16px">${title}</h1>
                ${body}
              </div>
              <div style="padding:16px 24px;background:#fafafa;color:#9ca3af;font-size:12px">
                DKmarket — la marketplace Côte d'Ivoire · paiement sécurisé GeniusPay
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>`;
}

async function send(to, subject, html) {
  if (!emailEnabled() || !to) return;
  await getTransporter().sendMail({
    from: env.mailFrom || env.smtpUser,
    to,
    subject,
    html: layout(subject, html),
  });
}

const itemRows = (items) =>
  items
    .map(
      (it) => `
      <tr>
        <td style="padding:8px 6px;border-bottom:1px solid #e5e7eb">${it.product?.name || 'Article'}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #e5e7eb;text-align:center">${it.quantity}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #e5e7eb;text-align:right">${money(it.subtotal)}</td>
      </tr>`,
    )
    .join('');

export async function sendOrderPaidEmail(to, order) {
  const address = order.address || {};
  await send(
    to,
    `Commande ${order.number} payée 🎉`,
    `
      <p style="color:#374151;font-size:14px;margin:0 0 16px">
        Merci ! Votre commande <strong>${order.number}</strong> a bien été payée ${money(order.total)}.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:16px">
        <tr style="background:#f9fafb">
          <th style="padding:8px 6px;text-align:left;font-size:12px;color:#6b7280">Article</th>
          <th style="padding:8px 6px;font-size:12px;color:#6b7280">Qté</th>
          <th style="padding:8px 6px;text-align:right;font-size:12px;color:#6b7280">Montant</th>
        </tr>
        ${itemRows(order.items)}
      </table>
      <p style="color:#374151;font-size:14px;margin:0 0 6px">
        Livraison : ${address.fullName} · ${address.city}, ${address.address}
      </p>
      <p style="color:#374151;font-size:14px;margin:0">
        Suivez votre commande ici : <a href="${env.clientUrl.split(',')[0]}/orders/${order.id}">Mes commandes</a>
      </p>`,
  );
}

export async function sendSellerSettledEmail(to, item) {
  const order = item.order || {};
  await send(
    to,
    `Vente encaissée — ${order.number || 'commande'}`,
    `
      <p style="color:#374151;font-size:14px;margin:0 0 12px">
        Bonne nouvelle ! L'article <strong>${item.product?.name || ''}</strong> (commande ${order.number || ''}) est livré.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:6px 8px;background:#f9fafb;color:#6b7280;font-size:13px">Montant brut</td>
          <td style="padding:6px 8px;text-align:right;font-size:13px">${money(item.subtotal)}</td>
        </tr>
        <tr>
          <td style="padding:6px 8px;background:#f9fafb;color:#6b7280;font-size:13px">Commission plateforme (1 %)</td>
          <td style="padding:6px 8px;text-align:right;font-size:13px;color:#dc2626">− ${money(item.commission)}</td>
        </tr>
        <tr>
          <td style="padding:6px 8px;background:#f9fafb;color:#111827;font-size:13px;font-weight:bold">Crédité à votre solde</td>
          <td style="padding:6px 8px;text-align:right;font-size:13px;font-weight:bold;color:#059669">${money(item.netAmount)}</td>
        </tr>
      </table>`,
  );
}

export async function sendAdminCommissionEmail(to, item) {
  const order = item.order || {};
  await send(
    to,
    `Commission 1 % reçue — ${order.number || 'commande'}`,
    `
      <p style="color:#374151;font-size:14px;margin:0 0 12px">
        Commission perçue sur le paiement de la commande <strong>${order.number || ''}</strong>
        (article « ${item.product?.name || ''} »), suite à sa livraison.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:6px 8px;background:#f9fafb;color:#6b7280;font-size:13px">Montant brut payé par le client</td>
          <td style="padding:6px 8px;text-align:right;font-size:13px">${money(item.subtotal)}</td>
        </tr>
        <tr>
          <td style="padding:6px 8px;background:#f9fafb;color:#6b7280;font-size:13px">Votre commission (1 %)</td>
          <td style="padding:6px 8px;text-align:right;font-size:13px;color:#059669">+ ${money(item.commission)}</td>
        </tr>
        <tr>
          <td style="padding:6px 8px;background:#f9fafb;color:#6b7280;font-size:13px">Net versé au vendeur</td>
          <td style="padding:6px 8px;text-align:right;font-size:13px">${money(item.netAmount)}</td>
        </tr>
      </table>`,
  );
}