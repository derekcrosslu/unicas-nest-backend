// loan-calculator.service.ts
import { Injectable } from '@nestjs/common';
import {
  LoanType,
  PaymentType,
  LoanCalculation,
  AmortizationRow,
  PaymentScheduleItem,
} from './types/prestamo.types';

@Injectable()
export class LoanCalculatorService {
  calculateLoan(
    amount: number,
    monthlyInterest: number,
    numberOfInstallments: number,
    loanType: LoanType,
    paymentType: PaymentType,
  ): LoanCalculation {
    let calculation: LoanCalculation;

    switch (loanType) {
      case 'CUOTA_FIJA':
        calculation = this.calculateFixedInstallment(
          amount,
          monthlyInterest,
          numberOfInstallments,
        );
        break;
      case 'CUOTA_REBATIR':
        calculation = this.calculateDecliningBalance(
          amount,
          monthlyInterest,
          numberOfInstallments,
        );
        break;
      case 'CUOTA_VENCIMIENTO':
        calculation = this.calculateInterestAtMaturity(
          amount,
          monthlyInterest,
          numberOfInstallments,
        );
        break;
      case 'CUOTA_VARIABLE':
        return this.calculateVariableSchedule(
          amount,
          monthlyInterest,
          numberOfInstallments,
        );
        break;
      default:
        throw new Error('Invalid loan type');
    }

    // Adjust payment frequency based on payment type
    const frequencyMultiplier = this.getFrequencyMultiplier(paymentType);
    if (calculation.monthlyPayment) {
      calculation.monthlyPayment =
        calculation.monthlyPayment * frequencyMultiplier;
    }

    return calculation;
  }

  private calculateVariableSchedule(
    principal: number,
    monthlyInterest: number,
    numberOfPayments: number,
  ): LoanCalculation {
    // Convert annual interest rate to monthly rate
    const monthlyRate = monthlyInterest / 100;

    // Calculate base quota using the formula
    const quota =
      principal *
      (monthlyRate / (1 - Math.pow(1 + monthlyRate, -numberOfPayments)));

    let remainingBalance = principal;
    const amortizationSchedule: AmortizationRow[] = [];
    let totalInterest = 0;

    for (let i = 0; i < numberOfPayments; i++) {
      // Recalculate interest based on current balance and rate
      const interest = remainingBalance * monthlyRate;
      totalInterest += interest;

      // Principal is the difference between quota and interest
      const principalPayment = quota - interest;

      // Update remaining balance
      remainingBalance -= principalPayment;

      amortizationSchedule.push({
        payment: quota,
        principal: principalPayment,
        interest,
        balance: Math.max(0, remainingBalance),
      });
    }

    return {
      monthlyPayment: quota,
      totalPayment: quota * numberOfPayments,
      totalInterest,
      amortizationSchedule,
    };
  }

  private getFrequencyMultiplier(paymentType: PaymentType): number {
    switch (paymentType) {
      case 'MENSUAL':
        return 1;
      case 'QUINCENAL':
        return 0.5;
      case 'SEMANAL':
        return 0.25;
      default:
        return 1;
    }
  }

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
    let totalInterest = 0;

    for (let i = 1; i <= numberOfInstallments; i++) {
      const interest = remainingBalance * monthlyRate;
      const principal = monthlyPayment - interest;
      remainingBalance -= principal;
      totalInterest += interest;

      amortizationSchedule.push({
        payment: monthlyPayment,
        principal,
        interest,
        balance: Math.max(0, remainingBalance),
      });
    }

    return {
      monthlyPayment,
      totalPayment: monthlyPayment * numberOfInstallments,
      totalInterest,
      amortizationSchedule,
    };
  }

  private calculateDecliningBalance(
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
      totalInterest,
      amortizationSchedule,
    };
  }

  private calculateInterestAtMaturity(
    amount: number,
    monthlyInterest: number,
    numberOfInstallments: number,
  ): LoanCalculation {
    const monthlyRate = monthlyInterest / 100;
    const monthlyInterestPayment = amount * monthlyRate; // Interest payment per month
    const totalInterest = amount * monthlyRate * numberOfInstallments;

    // Create amortization schedule
    const amortizationSchedule: AmortizationRow[] = [];

    // Add monthly interest payments (all installments except the last one)
    for (let i = 1; i < numberOfInstallments; i++) {
      amortizationSchedule.push({
        payment: monthlyInterestPayment,
        principal: 0,
        interest: monthlyInterestPayment,
        balance: amount, // Balance remains the same until final payment
      });
    }

    // Add final payment (last interest payment + principal)
    amortizationSchedule.push({
      payment: amount + monthlyInterestPayment,
      principal: amount,
      interest: monthlyInterestPayment,
      balance: 0,
    });

    return {
      monthlyPayment: monthlyInterestPayment,
      totalPayment: amount + totalInterest,
      totalInterest,
      amortizationSchedule,
    };
  }

  private calculateVariablePayments(
    amount: number,
    monthlyInterest: number,
    numberOfInstallments: number,
    paymentSchedule: PaymentScheduleItem[],
  ): LoanCalculation {
    const monthlyRate = monthlyInterest / 100;
    let remainingBalance = amount;
    const amortizationSchedule: AmortizationRow[] = [];
    let totalInterest = 0;

    for (let i = 0; i < numberOfInstallments; i++) {
      const payment = paymentSchedule[i].expected_amount;
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
      totalInterest,
      amortizationSchedule,
    };
  }
}
