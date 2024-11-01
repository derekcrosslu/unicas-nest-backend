import { Injectable } from '@nestjs/common';
import { AmortizationRow, LoanCalculation } from './types/prestamo.types';

@Injectable()
export class LoanCalculatorService {
  calculateFixedInstallment(
    amount: number,
    monthlyInterest: number,
    numberOfInstallments: number,
  ): LoanCalculation {
    const monthlyRate = monthlyInterest / 100;
    const monthlyPayment =
      (amount * monthlyRate * Math.pow(1 + monthlyRate, numberOfInstallments)) /
      (Math.pow(1 + monthlyRate, numberOfInstallments) - 1);

    let remainingBalance = amount;
    const amortizationSchedule: AmortizationRow[] = [];

    for (let i = 1; i <= numberOfInstallments; i++) {
      const interest = remainingBalance * monthlyRate;
      const principal = monthlyPayment - interest;
      remainingBalance -= principal;

      amortizationSchedule.push({
        payment: monthlyPayment,
        principal,
        interest,
        balance: Math.max(0, remainingBalance),
      });
    }

    const totalInterest = monthlyPayment * numberOfInstallments - amount;

    return {
      monthlyPayment,
      totalInterest,
      totalPayment: amount + totalInterest,
      amortizationSchedule,
    };
  }

  calculateDecliningBalance(
    amount: number,
    monthlyInterest: number,
    numberOfInstallments: number,
  ): LoanCalculation {
    const monthlyRate = monthlyInterest / 100;
    const principal = amount / numberOfInstallments;
    let remainingBalance = amount;
    const amortizationSchedule: AmortizationRow[] = [];
    let totalInterest = 0;

    for (let i = 1; i <= numberOfInstallments; i++) {
      const interest = remainingBalance * monthlyRate;
      const payment = principal + interest;
      remainingBalance -= principal;
      totalInterest += interest;

      amortizationSchedule.push({
        payment,
        principal,
        interest,
        balance: Math.max(0, remainingBalance),
      });
    }

    return {
      monthlyPayment: null,
      totalInterest,
      totalPayment: amount + totalInterest,
      amortizationSchedule,
    };
  }

  calculateInterestAtMaturity(
    amount: number,
    monthlyInterest: number,
    numberOfInstallments: number,
  ): LoanCalculation {
    const monthlyRate = monthlyInterest / 100;
    const totalInterest = amount * monthlyRate * numberOfInstallments;
    const totalPayment = amount + totalInterest;

    const amortizationSchedule: AmortizationRow[] = [
      {
        payment: totalPayment,
        principal: amount,
        interest: totalInterest,
        balance: 0,
      },
    ];

    return {
      monthlyPayment: null,
      totalInterest,
      totalPayment,
      amortizationSchedule,
    };
  }

  calculateVariablePayments(
    amount: number,
    monthlyInterest: number,
    numberOfInstallments: number,
    paymentSchedule: number[],
  ): LoanCalculation {
    const monthlyRate = monthlyInterest / 100;
    let remainingBalance = amount;
    const amortizationSchedule: AmortizationRow[] = [];
    let totalInterest = 0;

    for (let i = 0; i < numberOfInstallments; i++) {
      const payment = paymentSchedule[i];
      const interest = remainingBalance * monthlyRate;
      const principal = payment - interest;
      remainingBalance -= principal;
      totalInterest += interest;

      amortizationSchedule.push({
        payment,
        principal,
        interest,
        balance: Math.max(0, remainingBalance),
      });
    }

    return {
      monthlyPayment: null,
      totalInterest,
      totalPayment: amount + totalInterest,
      amortizationSchedule,
    };
  }

  validatePayment(
    amount: number,
    remainingAmount: number,
    monthlyInterest: number,
    paymentType: string,
    expectedPayment: number,
  ): boolean {
    // Basic validation: payment should not exceed remaining amount
    if (amount > remainingAmount) {
      return false;
    }

    // For fixed payments, amount should match expected payment
    if (paymentType === 'CUOTA_FIJA' && amount !== expectedPayment) {
      return false;
    }

    // For declining balance, amount should be at least interest portion
    const monthlyRate = monthlyInterest / 100;
    const minimumPayment = remainingAmount * monthlyRate;
    if (paymentType === 'CUOTA_REBATIR' && amount < minimumPayment) {
      return false;
    }

    // For payment at maturity, must pay full amount
    if (paymentType === 'CUOTA_VENCIMIENTO' && amount !== remainingAmount) {
      return false;
    }

    // For variable payments, amount should match schedule
    if (paymentType === 'CUOTA_VARIABLE' && amount !== expectedPayment) {
      return false;
    }

    return true;
  }
}
