--
-- PostgreSQL database dump
--

-- Dumped from database version 14.13 (Homebrew)
-- Dumped by pg_dump version 14.13 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: calculate_pmt(double precision, double precision, integer); Type: FUNCTION; Schema: public; Owner: donaldcross
--

CREATE FUNCTION public.calculate_pmt(p_principal double precision, p_rate double precision, p_periods integer) RETURNS double precision
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_rate FLOAT;
    v_pmt FLOAT;
BEGIN
    v_rate := p_rate / 100.0;  -- Convert percentage to decimal
    
    -- PMT = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
    v_pmt := p_principal * (v_rate * POWER(1 + v_rate, p_periods)) / 
             (POWER(1 + v_rate, p_periods) - 1);
             
    RETURN ROUND(v_pmt::numeric, 2)::FLOAT;
END;
$$;


ALTER FUNCTION public.calculate_pmt(p_principal double precision, p_rate double precision, p_periods integer) OWNER TO donaldcross;

--
-- Name: verify_capital_consistency(text, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: donaldcross
--

CREATE FUNCTION public.verify_capital_consistency(p_junta_id text, p_initial_capital double precision, p_prestamo_amount double precision, p_total_paid double precision) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_expected_capital FLOAT;
    v_actual_capital FLOAT;
BEGIN
    -- Calculate expected capital
    v_expected_capital := p_initial_capital - p_prestamo_amount + p_total_paid;
    
    -- Get actual capital
    SELECT current_capital 
    INTO v_actual_capital
    FROM "Junta"
    WHERE id = p_junta_id;
    
    -- Compare with small tolerance for floating point arithmetic
    RETURN ABS(v_expected_capital - v_actual_capital) < 0.01;
END;
$$;


ALTER FUNCTION public.verify_capital_consistency(p_junta_id text, p_initial_capital double precision, p_prestamo_amount double precision, p_total_paid double precision) OWNER TO donaldcross;

--
-- Name: verify_interest_calculation(text, double precision, double precision, integer); Type: FUNCTION; Schema: public; Owner: donaldcross
--

CREATE FUNCTION public.verify_interest_calculation(p_prestamo_id text, p_initial_amount double precision, p_interest_rate double precision, p_term_months integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_total_paid FLOAT;
    v_min_interest FLOAT;
BEGIN
    -- Get total amount paid
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_paid
    FROM "PagoPrestamoNew"
    WHERE prestamo_id = p_prestamo_id;
    
    -- Calculate minimum expected interest
    v_min_interest := p_initial_amount * (p_interest_rate/100) * p_term_months;
    
    -- Verify total paid covers principal plus minimum interest
    RETURN v_total_paid >= (p_initial_amount + v_min_interest);
END;
$$;


ALTER FUNCTION public.verify_interest_calculation(p_prestamo_id text, p_initial_amount double precision, p_interest_rate double precision, p_term_months integer) OWNER TO donaldcross;

--
-- Name: verify_payment_pattern(text, text); Type: FUNCTION; Schema: public; Owner: donaldcross
--

CREATE FUNCTION public.verify_payment_pattern(p_prestamo_id text, p_pattern text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_result BOOLEAN;
BEGIN
    CASE p_pattern
        WHEN 'FIXED' THEN
            -- Allow for last payment to be different
            SELECT COUNT(DISTINCT ROUND(amount::numeric, 2)) <= 2
            INTO v_result
            FROM (
                SELECT amount
                FROM "PagoPrestamoNew"
                WHERE prestamo_id = p_prestamo_id
                ORDER BY date DESC
                OFFSET 1
            ) regular_payments;
            
        WHEN 'DECREASING' THEN
            WITH payment_sequence AS (
                SELECT amount,
                       LAG(amount) OVER (ORDER BY date) as prev_amount
                FROM "PagoPrestamoNew"
                WHERE prestamo_id = p_prestamo_id
                ORDER BY date
            )
            SELECT COALESCE(
                NOT EXISTS (
                    SELECT 1
                    FROM payment_sequence
                    WHERE prev_amount IS NOT NULL
                    AND amount >= prev_amount
                ),
                true
            )
            INTO v_result;
            
        WHEN 'INCREASING' THEN
            WITH payment_sequence AS (
                SELECT amount,
                       LAG(amount) OVER (ORDER BY date) as prev_amount
                FROM "PagoPrestamoNew"
                WHERE prestamo_id = p_prestamo_id
                ORDER BY date
            )
            SELECT COALESCE(
                NOT EXISTS (
                    SELECT 1
                    FROM payment_sequence
                    WHERE prev_amount IS NOT NULL
                    AND amount <= prev_amount
                ),
                true
            )
            INTO v_result;
            
        WHEN 'SINGLE' THEN
            SELECT COUNT(*) = 1
            INTO v_result
            FROM "PagoPrestamoNew"
            WHERE prestamo_id = p_prestamo_id;
            
        ELSE
            v_result := false;
    END CASE;
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION public.verify_payment_pattern(p_prestamo_id text, p_pattern text) OWNER TO donaldcross;

--
-- PostgreSQL database dump complete
--

