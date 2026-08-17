"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting Tikane database seed...');
    // ─── Super Admin ─────────────────────────────────────────────
    const adminPassword = await bcrypt.hash('Admin@Tikane2025!', 12);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@tikane.ht' },
        update: {},
        create: {
            email: 'admin@tikane.ht',
            passwordHash: adminPassword,
            firstName: 'Super',
            lastName: 'Admin',
            role: client_1.Role.SUPER_ADMIN,
            emailVerified: true,
            referralCode: 'REF-ADMIN01',
        },
    });
    console.log(`✅ Super admin: ${superAdmin.email}`);
    // ─── Regular Admin ────────────────────────────────────────────
    const admin2 = await prisma.user.upsert({
        where: { email: 'manager@tikane.ht' },
        update: {},
        create: {
            email: 'manager@tikane.ht',
            passwordHash: adminPassword,
            firstName: 'Marie',
            lastName: 'Joseph',
            role: client_1.Role.ADMIN,
            emailVerified: true,
            referralCode: 'REF-MGR001',
        },
    });
    // ─── Agent Users ─────────────────────────────────────────────
    const agentPassword = await bcrypt.hash('Agent@2025!', 12);
    const agentUser1 = await prisma.user.upsert({
        where: { email: 'agent.nord@tikane.ht' },
        update: {},
        create: {
            email: 'agent.nord@tikane.ht',
            passwordHash: agentPassword,
            firstName: 'Jean-Pierre',
            lastName: 'Louis',
            role: client_1.Role.AGENT,
            emailVerified: true,
            phone: '+50937000001',
            referralCode: 'REF-AGT001',
        },
    });
    const agentUser2 = await prisma.user.upsert({
        where: { email: 'agent.ouest@tikane.ht' },
        update: {},
        create: {
            email: 'agent.ouest@tikane.ht',
            passwordHash: agentPassword,
            firstName: 'Claudette',
            lastName: 'Pierre',
            role: client_1.Role.AGENT,
            emailVerified: true,
            phone: '+50937000002',
            referralCode: 'REF-AGT002',
        },
    });
    // Create Agent records
    await prisma.agent.upsert({
        where: { userId: agentUser1.id },
        update: {},
        create: {
            userId: agentUser1.id,
            agentCode: 'AGT-NORD-001',
            zone: 'Nord',
            commissionRate: 3.5,
            isActive: true,
        },
    });
    await prisma.agent.upsert({
        where: { userId: agentUser2.id },
        update: {},
        create: {
            userId: agentUser2.id,
            agentCode: 'AGT-OUEST-001',
            zone: 'Ouest',
            commissionRate: 3.5,
            isActive: true,
        },
    });
    console.log('✅ Agents created');
    // ─── Client Users ─────────────────────────────────────────────
    const clientPassword = await bcrypt.hash('Client@2025!', 12);
    const clients = await Promise.all([
        prisma.user.upsert({
            where: { email: 'client1@example.com' },
            update: {},
            create: {
                email: 'client1@example.com',
                passwordHash: clientPassword,
                firstName: 'Odette',
                lastName: 'Blanc',
                role: client_1.Role.CLIENT,
                emailVerified: true,
                phone: '+50937111001',
                referralCode: 'REF-CLI001',
            },
        }),
        prisma.user.upsert({
            where: { email: 'client2@example.com' },
            update: {},
            create: {
                email: 'client2@example.com',
                passwordHash: clientPassword,
                firstName: 'Marc',
                lastName: 'Antoine',
                role: client_1.Role.CLIENT,
                emailVerified: true,
                phone: '+50937111002',
                referralCode: 'REF-CLI002',
            },
        }),
        prisma.user.upsert({
            where: { email: 'client3@example.com' },
            update: {},
            create: {
                email: 'client3@example.com',
                passwordHash: clientPassword,
                firstName: 'Rosette',
                lastName: 'Duval',
                role: client_1.Role.CLIENT,
                emailVerified: true,
                phone: '+50937111003',
                referralCode: 'REF-CLI003',
            },
        }),
    ]);
    console.log(`✅ ${clients.length} client users created`);
    // ─── System Config ────────────────────────────────────────────
    const configs = [
        { key: 'platform_name', value: 'Tikane', description: 'Nom de la plateforme' },
        { key: 'platform_fee_rate', value: '2.5', description: 'Taux de frais plateforme (%)' },
        { key: 'default_grace_period_days', value: '3', description: 'Jours de grâce par défaut' },
        { key: 'default_late_penalty_rate', value: '5', description: 'Taux de pénalité retard (%)' },
        { key: 'withdrawal_delay_days', value: '30', description: 'Délai avant retrait (jours)' },
        { key: 'max_missed_payments', value: '5', description: 'Paiements manqués max avant suspension' },
        { key: 'currency', value: 'HTG', description: 'Devise par défaut' },
        { key: 'support_email', value: 'support@tikane.ht', description: 'Email de support' },
        { key: 'support_phone', value: '+50937000000', description: 'Téléphone support' },
    ];
    for (const config of configs) {
        await prisma.systemConfig.upsert({
            where: { key: config.key },
            update: { value: config.value },
            create: { key: config.key, value: config.value, label: config.description },
        });
    }
    console.log('✅ System configs set');
    // ─── Plans ────────────────────────────────────────────────────
    const now = new Date();
    // 1. Progressive Plan (30 days: starts 100 HTG, +50/day)
    const progressivePlan = await prisma.plan.upsert({
        where: { id: 'plan-progressive-001' },
        update: {},
        create: {
            id: 'plan-progressive-001',
            name: 'Sòl Pwogrèsif 30 Jou',
            nameCreole: 'Sòl Pwogrèsif',
            description: 'Épargnez progressivement avec des montants croissants chaque jour',
            descriptionCreole: 'Ekonomize chak jou ak yon montan k ap ogmante',
            type: client_1.PlanType.PROGRESSIVE,
            status: client_1.PlanStatus.ACTIVE,
            durationDays: 30,
            startAmount: 100,
            incrementAmount: 50,
            totalAmount: 25500, // sum of 100 to 1550 over 30 days
            finalAmount: 25500,
            registrationFee: 0,
            caNeetFee: 0,
            platformFeeRate: 2.5,
            agentCommissionRate: 3.5,
            withdrawalDelayDays: 30,
            gracePeriodDays: 3,
            latePenaltyRate: 5,
            maxMissedPayments: 5,
            maxParticipants: 100,
            isPublic: true,
            isFeatured: true,
        },
    });
    // 2. Fixed Daily (30 days, 500 HTG/day)
    const fixedPlan = await prisma.plan.upsert({
        where: { id: 'plan-fixed-001' },
        update: {},
        create: {
            id: 'plan-fixed-001',
            name: 'Sòl Fiks 500 HTG',
            nameCreole: 'Sòl Fiks',
            description: 'Plan simple avec 500 HTG par jour pendant 30 jours',
            descriptionCreole: 'Plan senp: 500 HTG chak jou pou 30 jou',
            type: client_1.PlanType.FIXED_DAILY,
            status: client_1.PlanStatus.ACTIVE,
            durationDays: 30,
            startAmount: 500,
            fixedAmount: 500,
            totalAmount: 15000,
            finalAmount: 15000,
            registrationFee: 0,
            caNeetFee: 0,
            platformFeeRate: 2.5,
            agentCommissionRate: 3.5,
            withdrawalDelayDays: 30,
            gracePeriodDays: 3,
            latePenaltyRate: 5,
            maxMissedPayments: 5,
            maxParticipants: 200,
            isPublic: true,
            isFeatured: false,
        },
    });
    // 3. Weekly Plan (12 weeks, 2000 HTG/week)
    const weeklyPlan = await prisma.plan.upsert({
        where: { id: 'plan-weekly-001' },
        update: {},
        create: {
            id: 'plan-weekly-001',
            name: 'Sòl Semèn 12 Semèn',
            nameCreole: 'Sòl Chak Semèn',
            description: 'Versement hebdomadaire de 2000 HTG sur 12 semaines',
            descriptionCreole: '2000 HTG chak semèn pou 12 semèn',
            type: client_1.PlanType.WEEKLY,
            status: client_1.PlanStatus.ACTIVE,
            durationDays: 84, // 12 weeks
            startAmount: 2000,
            fixedAmount: 2000,
            totalAmount: 24000,
            finalAmount: 24000,
            registrationFee: 0,
            caNeetFee: 0,
            platformFeeRate: 2.5,
            agentCommissionRate: 3.5,
            withdrawalDelayDays: 14,
            gracePeriodDays: 2,
            latePenaltyRate: 3,
            maxMissedPayments: 3,
            maxParticipants: 50,
            isPublic: true,
            isFeatured: false,
        },
    });
    // 4. Monthly Plan (6 months, 5000 HTG/month)
    const monthlyPlan = await prisma.plan.upsert({
        where: { id: 'plan-monthly-001' },
        update: {},
        create: {
            id: 'plan-monthly-001',
            name: 'Sòl Mensyèl 6 Mwa',
            nameCreole: 'Sòl Chak Mwa',
            description: 'Épargne mensuelle de 5000 HTG sur 6 mois',
            descriptionCreole: '5000 HTG chak mwa pou 6 mwa',
            type: client_1.PlanType.MONTHLY,
            status: client_1.PlanStatus.ACTIVE,
            durationDays: 180,
            startAmount: 5000,
            fixedAmount: 5000,
            totalAmount: 30000,
            finalAmount: 30000,
            registrationFee: 0,
            caNeetFee: 0,
            platformFeeRate: 2.5,
            agentCommissionRate: 3.5,
            withdrawalDelayDays: 30,
            gracePeriodDays: 5,
            latePenaltyRate: 4,
            maxMissedPayments: 2,
            maxParticipants: 30,
            isPublic: true,
            isFeatured: true,
        },
    });
    // 5. Sabotay Plan (30 days, 10000 HTG principal, 5% monthly simple interest)
    const sabotayPlan = await prisma.plan.upsert({
        where: { id: 'plan-sabotay-001' },
        update: {},
        create: {
            id: 'plan-sabotay-001',
            name: 'Sabotay 10K HTG',
            nameCreole: 'Sabotay',
            description: 'Placez 10,000 HTG et recevez 10,500 HTG avec intérêt simple de 5%',
            descriptionCreole: 'Mete 10,000 HTG resevwa 10,500 HTG ak 5% enterè',
            type: client_1.PlanType.SABOTAY,
            status: client_1.PlanStatus.ACTIVE,
            durationDays: 30,
            startAmount: 10000,
            fixedAmount: 10000,
            interestRate: 5,
            interestType: 'SIMPLE',
            totalAmount: 10000,
            finalAmount: 10500,
            registrationFee: 0,
            caNeetFee: 0,
            platformFeeRate: 1.5,
            agentCommissionRate: 2,
            withdrawalDelayDays: 30,
            gracePeriodDays: 0,
            latePenaltyRate: 0,
            maxMissedPayments: 0,
            maxParticipants: 50,
            isPublic: true,
            isFeatured: true,
        },
    });
    console.log('✅ 5 plans created (Progressive, Fixed, Weekly, Monthly, Sabotay)');
    // ─── Notification templates ───────────────────────────────────
    const templates = [
        {
            type: 'WELCOME',
            channel: 'EMAIL',
            language: 'fr',
            subject: 'Bienvenue sur Tikane!',
            bodyTemplate: '<h1>Bienvenue {{firstName}}!</h1><p>Votre compte Tikane a été créé avec succès.</p>',
        },
        {
            type: 'PAYMENT_CONFIRMED',
            channel: 'EMAIL',
            language: 'fr',
            subject: 'Paiement confirmé - {{referenceNumber}}',
            bodyTemplate: '<h1>Paiement confirmé</h1><p>Votre paiement de {{amount}} HTG a été confirmé.</p>',
        },
        {
            type: 'PAYMENT_REMINDER',
            channel: 'EMAIL',
            language: 'fr',
            subject: 'Rappel de paiement - {{planName}}',
            bodyTemplate: '<h1>Rappel</h1><p>Votre prochain paiement de {{amount}} HTG est dû le {{dueDate}}.</p>',
        },
        {
            type: 'PAYMENT_REMINDER',
            channel: 'SMS',
            language: 'fr',
            subject: '',
            bodyTemplate: 'Tikane: Paiement {{amount}} HTG dû le {{dueDate}} - {{planName}}',
        },
    ];
    for (const template of templates) {
        await prisma.notificationTemplate.upsert({
            where: { type_channel_language: { type: template.type, channel: template.channel, language: template.language } },
            update: { subject: template.subject, bodyTemplate: template.bodyTemplate },
            create: {
                type: template.type,
                channel: template.channel,
                language: template.language,
                subject: template.subject,
                bodyTemplate: template.bodyTemplate,
                isActive: true,
            },
        });
    }
    console.log('✅ Notification templates created');
    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Credentials:');
    console.log('   Super Admin: admin@tikane.ht / Admin@Tikane2025!');
    console.log('   Admin:       manager@tikane.ht / Admin@Tikane2025!');
    console.log('   Agent 1:     agent.nord@tikane.ht / Agent@2025!');
    console.log('   Agent 2:     agent.ouest@tikane.ht / Agent@2025!');
    console.log('   Client 1:    client1@example.com / Client@2025!');
    console.log('   Client 2:    client2@example.com / Client@2025!');
    console.log('   Client 3:    client3@example.com / Client@2025!');
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
//# sourceMappingURL=seed.js.map