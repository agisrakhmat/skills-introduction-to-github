/**
 * FinanceController.gs
 * Handles Payments.
 */

if (typeof DatabaseWrapper === 'undefined' && typeof require !== 'undefined') {
  var DatabaseWrapper = require('./DatabaseWrapper.gs');
}

var FinanceController = (function() {

  function submitPayment(studentId, amount, proofUrl) {
    var payment = {
      payment_id: 'PAY_' + new Date().getTime(),
      student_id: studentId,
      amount: amount,
      proof_url: proofUrl,
      status: 'PENDING'
    };

    if (typeof DatabaseWrapper._appendRow !== 'undefined') {
        DatabaseWrapper._appendRow('PAYMENTS', payment);
    }
    return payment;
  }

  function verifyPayment(paymentId, status) {
     return true;
  }

  return {
    submitPayment: submitPayment,
    verifyPayment: verifyPayment
  };

})();

if (typeof module !== 'undefined') {
  module.exports = FinanceController;
}
