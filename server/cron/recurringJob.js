const cron = require('node-cron');
const RecurringTransaction = require('../models/RecurringTransaction');
const Transaction = require('../models/Transaction');

const setupRecurringJobs = () => {
  // Run every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running recurring transaction job...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const recurringTransactions = await RecurringTransaction.find({
        active: true,
        nextDate: { $lte: today },
        $or: [{ endDate: null }, { endDate: { $gte: today } }]
      });

      for (let rt of recurringTransactions) {
        // Create the actual transaction
        const newTx = new Transaction({
          userId: rt.userId,
          merchant: rt.merchant,
          amount: rt.amount,
          category: rt.category,
          type: rt.type,
          date: today,
          isSubscription: true,
          note: 'Auto-generated recurring transaction'
        });

        await newTx.save();

        // Calculate next date
        let next = new Date(rt.nextDate);
        if (rt.frequency === 'daily') next.setDate(next.getDate() + rt.interval);
        else if (rt.frequency === 'weekly') next.setDate(next.getDate() + (7 * rt.interval));
        else if (rt.frequency === 'monthly') next.setMonth(next.getMonth() + rt.interval);
        else if (rt.frequency === 'yearly') next.setFullYear(next.getFullYear() + rt.interval);

        rt.lastGenerated = today;
        rt.nextDate = next;
        
        // If next date is past end date, deactivate
        if (rt.endDate && next > rt.endDate) {
          rt.active = false;
        }

        await rt.save();

        const Notification = require('../models/Notification');
        await Notification.create({
          userId: rt.userId,
          title: 'Recurring Transaction Processed',
          message: `Your automated ${rt.type} of $${rt.amount} for ${rt.merchant} has been recorded.`,
          type: 'recurring'
        });
      }
      console.log(`[CRON] Processed ${recurringTransactions.length} recurring transactions.`);
    } catch (error) {
      console.error('[CRON] Error processing recurring transactions:', error);
    }
  });
};

module.exports = setupRecurringJobs;
