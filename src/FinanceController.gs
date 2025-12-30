/**
 * FinanceController.gs
 * Handles Finance Logic
 */
var FinanceController = {
  verifyPayment: function(financeId, paymentId, status) {
      if (['VERIFIED', 'REJECTED'].indexOf(status) === -1) {
          return { status: 'error', message: 'Invalid status' };
      }

      var payment = findRow(TABLES.PAYMENTS, 'payment_id', paymentId);
      if (!payment) return { status: 'error', message: 'Payment not found' };

      updateRow(TABLES.PAYMENTS, 'payment_id', paymentId, { status: status });
      return { status: 'success', message: 'Payment updated' };
  }
};
