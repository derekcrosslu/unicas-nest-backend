--
-- PostgreSQL database dump
--

-- Dumped from database version 14.15 (Homebrew)
-- Dumped by pg_dump version 14.15 (Homebrew)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Accion; Type: TABLE; Schema: public; Owner: donaldcross
--

CREATE TABLE public."Accion" (
    id text NOT NULL,
    type text NOT NULL,
    amount double precision NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "juntaId" text NOT NULL,
    "memberId" text NOT NULL,
    affects_capital boolean DEFAULT true NOT NULL,
    "shareValue" double precision NOT NULL,
    "agendaItemId" text
);


ALTER TABLE public."Accion" OWNER TO donaldcross;

--
-- Name: AgendaItem; Type: TABLE; Schema: public; Owner: donaldcross
--

CREATE TABLE public."AgendaItem" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "juntaId" text NOT NULL,
    "weekStartDate" timestamp(3) without time zone NOT NULL,
    "weekEndDate" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AgendaItem" OWNER TO donaldcross;

--
-- Name: CapitalMovement; Type: TABLE; Schema: public; Owner: donaldcross
--

CREATE TABLE public."CapitalMovement" (
    id text NOT NULL,
    amount double precision NOT NULL,
    type text NOT NULL,
    direction text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "juntaId" text NOT NULL,
    "prestamoId" text,
    "multaId" text,
    "accionId" text,
    "pagoId" text
);


ALTER TABLE public."CapitalMovement" OWNER TO donaldcross;

--
-- Name: CapitalSocial; Type: TABLE; Schema: public; Owner: donaldcross
--

CREATE TABLE public."CapitalSocial" (
    id text NOT NULL,
    amount double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "juntaId" text NOT NULL
);


ALTER TABLE public."CapitalSocial" OWNER TO donaldcross;

--
-- Name: DailyAttendance; Type: TABLE; Schema: public; Owner: donaldcross
--

CREATE TABLE public."DailyAttendance" (
    id text NOT NULL,
    "agendaItemId" text NOT NULL,
    "userId" text NOT NULL,
    "dayScheduleId" text NOT NULL,
    attended boolean DEFAULT false NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DailyAttendance" OWNER TO donaldcross;

--
-- Name: DaySchedule; Type: TABLE; Schema: public; Owner: donaldcross
--

CREATE TABLE public."DaySchedule" (
    id text NOT NULL,
    "dayOfWeek" text NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    "agendaItemId" text NOT NULL
);


ALTER TABLE public."DaySchedule" OWNER TO donaldcross;

--
-- Name: GastoCapital; Type: TABLE; Schema: public; Owner: donaldcross
--

CREATE TABLE public."GastoCapital" (
    id text NOT NULL,
    amount double precision NOT NULL,
    description text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "capitalSocialId" text NOT NULL
);


ALTER TABLE public."GastoCapital" OWNER TO donaldcross;

--
-- Name: IngresoCapital; Type: TABLE; Schema: public; Owner: donaldcross
--

CREATE TABLE public."IngresoCapital" (
    id text NOT NULL,
    amount double precision NOT NULL,
    description text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "capitalSocialId" text NOT NULL
);


ALTER TABLE public."IngresoCapital" OWNER TO donaldcross;

--
-- Name: Junta; Type: TABLE; Schema: public; Owner: donaldcross
--

CREATE TABLE public."Junta" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    fecha_inicio timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text NOT NULL,
    available_capital double precision DEFAULT 0 NOT NULL,
    base_capital double precision DEFAULT 0 NOT NULL,
    current_capital double precision DEFAULT 0 NOT NULL
);


ALTER TABLE public."Junta" OWNER TO donaldcross;

--
-- Name: JuntaMember; Type: TABLE; Schema: public; Owner: donaldcross
--

CREATE TABLE public."JuntaMember" (
    id text NOT NULL,
    "juntaId" text NOT NULL,
    "userId" text NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."JuntaMember" OWNER TO donaldcross;

--
-- Name: Multa; Type: TABLE; Schema: public; Owner: donaldcross
--

CREATE TABLE public."Multa" (
    id text NOT NULL,
    amount double precision NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "juntaId" text NOT NULL,
    "memberId" text NOT NULL,
    affects_capital boolean DEFAULT true NOT NULL,
    "agendaItemId" text
);


ALTER TABLE public."Multa" OWNER TO donaldcross;

--
-- Name: PagoPrestamo; Type: TABLE; Schema: public; Owner: donaldcross
--

CREATE TABLE public."PagoPrestamo" (
    id text NOT NULL,
    amount double precision NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "prestamoId" text NOT NULL
);


ALTER TABLE public."PagoPrestamo" OWNER TO donaldcross;

--
-- Name: PagoPrestamoNew; Type: TABLE; Schema: public; Owner: donaldcross
--

CREATE TABLE public."PagoPrestamoNew" (
    id text NOT NULL,
    amount double precision NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "prestamoId" text NOT NULL,
    original_pago_id text,
    affects_capital boolean DEFAULT true NOT NULL,
    "agendaItemId" text,
    capital_amount double precision DEFAULT 0 NOT NULL,
    interest_amount double precision DEFAULT 0 NOT NULL,
    installment_number integer DEFAULT 0
);


ALTER TABLE public."PagoPrestamoNew" OWNER TO donaldcross;

--
-- Name: PaymentSchedule; Type: TABLE; Schema: public; Owner: donaldcross
--

CREATE TABLE public."PaymentSchedule" (
    id text NOT NULL,
    due_date timestamp(3) without time zone NOT NULL,
    expected_amount double precision NOT NULL,
    principal double precision NOT NULL,
    interest double precision NOT NULL,
    installment_number integer NOT NULL,
    status text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "prestamoId" text NOT NULL,
    remaining_balance double precision DEFAULT 0 NOT NULL,
    paid_amount double precision DEFAULT 0 NOT NULL,
    "loanAmount" double precision DEFAULT 0 NOT NULL
);


ALTER TABLE public."PaymentSchedule" OWNER TO donaldcross;

--
-- Name: PerformanceMetric; Type: TABLE; Schema: public; Owner: donaldcross
--

CREATE TABLE public."PerformanceMetric" (
    id integer NOT NULL,
    type text NOT NULL,
    value double precision NOT NULL,
    pathname text NOT NULL,
    "searchParams" jsonb,
    "timestamp" timestamp(3) without time zone NOT NULL,
    "navigationStart" double precision,
    "navigationDuration" double precision,
    "elementId" text,
    "elementTag" text,
    url text NOT NULL,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PerformanceMetric" OWNER TO donaldcross;

--
-- Name: PerformanceMetric_id_seq; Type: SEQUENCE; Schema: public; Owner: donaldcross
--

CREATE SEQUENCE public."PerformanceMetric_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."PerformanceMetric_id_seq" OWNER TO donaldcross;

--
-- Name: PerformanceMetric_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: donaldcross
--

ALTER SEQUENCE public."PerformanceMetric_id_seq" OWNED BY public."PerformanceMetric".id;


--
-- Name: Prestamo; Type: TABLE; Schema: public; Owner: donaldcross
--

CREATE TABLE public."Prestamo" (
    id text NOT NULL,
    amount double precision NOT NULL,
    description text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "juntaId" text NOT NULL,
    "memberId" text NOT NULL
);


ALTER TABLE public."Prestamo" OWNER TO donaldcross;

--
-- Name: PrestamoNew; Type: TABLE; Schema: public; Owner: donaldcross
--

CREATE TABLE public."PrestamoNew" (
    id text NOT NULL,
    amount double precision NOT NULL,
    description text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    request_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    monthly_interest double precision DEFAULT 0 NOT NULL,
    number_of_installments integer DEFAULT 1 NOT NULL,
    approved boolean DEFAULT false NOT NULL,
    rejected boolean DEFAULT false NOT NULL,
    rejection_reason text,
    paid boolean DEFAULT false NOT NULL,
    remaining_amount double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "juntaId" text NOT NULL,
    "memberId" text NOT NULL,
    original_prestamo_id text,
    affects_capital boolean DEFAULT true NOT NULL,
    "avalId" text,
    capital_at_time double precision NOT NULL,
    capital_snapshot jsonb,
    form_cost double precision DEFAULT 2.0 NOT NULL,
    form_purchased boolean DEFAULT false NOT NULL,
    guarantee_detail text,
    guarantee_type text NOT NULL,
    loan_code text NOT NULL,
    loan_number integer NOT NULL,
    payment_type text NOT NULL,
    reason text NOT NULL,
    loan_type text NOT NULL,
    "agendaItemId" text
);


ALTER TABLE public."PrestamoNew" OWNER TO donaldcross;

--
-- Name: User; Type: TABLE; Schema: public; Owner: donaldcross
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text,
    username text NOT NULL,
    password text DEFAULT '$2b$10$6jXzYyNVXB5V6863yxGIzOC5D.yqNoE1lO9H.hU4UYVKiV5BOh2S6'::text NOT NULL,
    role text DEFAULT 'USER'::text NOT NULL,
    document_type text,
    document_number text,
    full_name text,
    birth_date timestamp(3) without time zone,
    address text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    phone text NOT NULL,
    additional_info text,
    beneficiary_address text,
    beneficiary_document_number text,
    beneficiary_document_type text,
    beneficiary_full_name text,
    beneficiary_phone text,
    gender text,
    join_date timestamp(3) without time zone,
    member_role text,
    productive_activity text,
    status text DEFAULT 'Activo'::text NOT NULL
);


ALTER TABLE public."User" OWNER TO donaldcross;

--
-- Name: _UserAgendaItems; Type: TABLE; Schema: public; Owner: donaldcross
--

CREATE TABLE public."_UserAgendaItems" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_UserAgendaItems" OWNER TO donaldcross;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: donaldcross
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO donaldcross;

--
-- Name: PerformanceMetric id; Type: DEFAULT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."PerformanceMetric" ALTER COLUMN id SET DEFAULT nextval('public."PerformanceMetric_id_seq"'::regclass);


--
-- Data for Name: Accion; Type: TABLE DATA; Schema: public; Owner: donaldcross
--

COPY public."Accion" (id, type, amount, description, "createdAt", "updatedAt", "juntaId", "memberId", affects_capital, "shareValue", "agendaItemId") FROM stdin;
fcb18cab-95be-4cfc-827a-ebe8edb948ae	COMPRA	100	Compra de acciones por 100 acciones el dia 2024-12-12	2024-12-12 13:43:17.671	2024-12-12 13:43:17.671	9aee4d9a-0b00-4fee-b89c-2c28434c81c2	1cdf1729-984f-4d0c-bf3e-af4426d71d16	t	5	\N
\.


--
-- Data for Name: AgendaItem; Type: TABLE DATA; Schema: public; Owner: donaldcross
--

COPY public."AgendaItem" (id, title, description, "createdAt", "updatedAt", "juntaId", "weekStartDate", "weekEndDate") FROM stdin;
333deeae-4d66-4f8a-bb65-b6a3dc6579a8	Weekly Meeting	Regular team sync	2024-12-10 03:00:49.395	2024-12-10 03:00:49.395	9aee4d9a-0b00-4fee-b89c-2c28434c81c2	2024-11-25 00:00:00	2024-12-01 00:00:00
e56fed9a-c45c-4b02-9da6-11e2933772cc	Weekly Meeting	Regular team sync	2024-12-10 03:00:53.452	2024-12-10 03:00:53.452	9aee4d9a-0b00-4fee-b89c-2c28434c81c2	2024-11-25 00:00:00	2024-12-01 00:00:00
25be9528-cbae-489e-aeda-898aa87dc710	Weekly Meeting	Regular team sync	2024-12-10 03:00:56.51	2024-12-10 03:00:56.51	9aee4d9a-0b00-4fee-b89c-2c28434c81c2	2024-11-25 00:00:00	2024-12-01 00:00:00
66c1e706-35df-478e-98b5-424d626716fd	Weekly Meeting	Regular team sync	2024-12-10 03:00:57.065	2024-12-10 03:00:57.065	9aee4d9a-0b00-4fee-b89c-2c28434c81c2	2024-11-25 00:00:00	2024-12-01 00:00:00
c522462f-d09f-4a32-8198-2ff1c8d0bfb1	Weekly Meeting	Regular team sync	2024-12-10 03:00:57.302	2024-12-10 03:00:57.302	9aee4d9a-0b00-4fee-b89c-2c28434c81c2	2024-11-25 00:00:00	2024-12-01 00:00:00
b6d6b4cf-35b7-464b-8019-3badcb55aead	Weekly Meeting	Regular team sync	2024-12-10 03:00:57.496	2024-12-10 03:00:57.496	9aee4d9a-0b00-4fee-b89c-2c28434c81c2	2024-11-25 00:00:00	2024-12-01 00:00:00
923b4aa5-1df0-4677-b7ed-0f9abf327fad	Weekly Meeting	Regular team sync	2024-12-10 03:00:57.658	2024-12-10 03:00:57.658	9aee4d9a-0b00-4fee-b89c-2c28434c81c2	2024-11-25 00:00:00	2024-12-01 00:00:00
4d1fe34e-64eb-4dc3-945c-50a45b1a8462	Weekly Meeting	Regular team sync	2024-12-10 03:00:57.836	2024-12-10 03:00:57.836	9aee4d9a-0b00-4fee-b89c-2c28434c81c2	2024-11-25 00:00:00	2024-12-01 00:00:00
1ad25111-b805-49da-a9b9-1f603efb4123	Weekly Meeting	Regular team sync	2024-12-10 03:00:57.948	2024-12-10 03:00:57.948	9aee4d9a-0b00-4fee-b89c-2c28434c81c2	2024-11-25 00:00:00	2024-12-01 00:00:00
\.


--
-- Data for Name: CapitalMovement; Type: TABLE DATA; Schema: public; Owner: donaldcross
--

COPY public."CapitalMovement" (id, amount, type, direction, description, "createdAt", "juntaId", "prestamoId", "multaId", "accionId", "pagoId") FROM stdin;
654b3073-572e-45ab-a3b2-66b380939477	29.9	PAGO	INCREASE	Pago de préstamo CUOTA_FIJA-1734383048143	2024-12-16 21:04:22.147	9aee4d9a-0b00-4fee-b89c-2c28434c81c2	9fed6730-9d59-4c7a-a1a6-127591ff62b4	\N	\N	0e2ca98f-1382-469b-9d83-d2d1760bde40
af41175a-7e79-44b8-b387-9ee0c4aefbe6	29.9	PAGO	INCREASE	Pago de préstamo CUOTA_FIJA-1734383048143	2024-12-16 21:04:28.588	9aee4d9a-0b00-4fee-b89c-2c28434c81c2	9fed6730-9d59-4c7a-a1a6-127591ff62b4	\N	\N	ecb9e759-491e-4fcb-80ca-7388b5c9ad15
c566894a-edd8-4d76-bf3c-479cdeedbb0d	29.9	PAGO	INCREASE	Pago de préstamo CUOTA_FIJA-1734383048143	2024-12-16 21:04:33.731	9aee4d9a-0b00-4fee-b89c-2c28434c81c2	9fed6730-9d59-4c7a-a1a6-127591ff62b4	\N	\N	1fe9ebaf-a706-46b8-b382-114d429587d9
319dc425-f565-4ba9-be99-cc5f73e3d423	29.9	PAGO	INCREASE	Pago de préstamo CUOTA_FIJA-1734383048143	2024-12-16 21:04:38.174	9aee4d9a-0b00-4fee-b89c-2c28434c81c2	9fed6730-9d59-4c7a-a1a6-127591ff62b4	\N	\N	58329ea3-c1ef-4fd1-a3a8-cd82f811e311
4703014e-7917-4e7e-9ce0-8ec60ab456b1	29.9	PAGO	INCREASE	Pago de préstamo CUOTA_FIJA-1734383048143	2024-12-16 21:04:43.973	9aee4d9a-0b00-4fee-b89c-2c28434c81c2	9fed6730-9d59-4c7a-a1a6-127591ff62b4	\N	\N	ec27ad90-6feb-4107-94c3-899f83536d7e
d7161dbe-7917-442c-a046-22f26d60502b	130	PRESTAMO	DECREASE	Préstamo CUOTA_FIJA - CUOTA_FIJA-1734383048143	2024-12-16 21:04:08.143	9aee4d9a-0b00-4fee-b89c-2c28434c81c2	9fed6730-9d59-4c7a-a1a6-127591ff62b4	\N	\N	\N
5d4a3dff-edf8-40d5-a5ca-fd55f671d3c0	100	accion	ingreso	Compra de acciones por 100 acciones el dia 2024-12-12	2024-12-12 13:43:17.671	9aee4d9a-0b00-4fee-b89c-2c28434c81c2	\N	\N	fcb18cab-95be-4cfc-827a-ebe8edb948ae	\N
\.


--
-- Data for Name: CapitalSocial; Type: TABLE DATA; Schema: public; Owner: donaldcross
--

COPY public."CapitalSocial" (id, amount, "createdAt", "updatedAt", "juntaId") FROM stdin;
\.


--
-- Data for Name: DailyAttendance; Type: TABLE DATA; Schema: public; Owner: donaldcross
--

COPY public."DailyAttendance" (id, "agendaItemId", "userId", "dayScheduleId", attended, date, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DaySchedule; Type: TABLE DATA; Schema: public; Owner: donaldcross
--

COPY public."DaySchedule" (id, "dayOfWeek", "startTime", "endTime", "agendaItemId") FROM stdin;
4c275b4a-d6bf-41cd-87c3-ef1338a91c56	MONDAY	2024-11-24 14:00:00	2024-11-24 15:00:00	333deeae-4d66-4f8a-bb65-b6a3dc6579a8
4c266ff7-6908-486a-8512-a08b3ced76a7	TUESDAY	2024-11-25 14:00:00	2024-11-25 15:00:00	333deeae-4d66-4f8a-bb65-b6a3dc6579a8
47ad4cee-d22d-4587-861f-e42a1b57a6cf	WEDNESDAY	2024-11-26 14:00:00	2024-11-26 15:00:00	333deeae-4d66-4f8a-bb65-b6a3dc6579a8
ea3937bb-3920-4106-a980-2589d5f07b17	THURSDAY	2024-11-27 14:00:00	2024-11-27 15:00:00	333deeae-4d66-4f8a-bb65-b6a3dc6579a8
102c61b2-bbcf-429b-be19-18c8e9f59626	FRIDAY	2024-11-28 14:00:00	2024-11-28 15:00:00	333deeae-4d66-4f8a-bb65-b6a3dc6579a8
ecdbe86f-fc40-4a0e-8ee3-f60400c3a003	SATURDAY	2024-11-29 14:00:00	2024-11-29 15:00:00	333deeae-4d66-4f8a-bb65-b6a3dc6579a8
74140c24-bb1b-4b2c-b5de-9c2ca985f161	SUNDAY	2024-11-30 14:00:00	2024-11-30 15:00:00	333deeae-4d66-4f8a-bb65-b6a3dc6579a8
bb4703fc-dca3-479c-854e-1c09123c883b	MONDAY	2024-11-24 14:00:00	2024-11-24 15:00:00	e56fed9a-c45c-4b02-9da6-11e2933772cc
a6dbce78-2047-4c85-8e06-6533a516790b	TUESDAY	2024-11-25 14:00:00	2024-11-25 15:00:00	e56fed9a-c45c-4b02-9da6-11e2933772cc
6ecdf789-64c9-47ad-94d6-fb30bad35611	WEDNESDAY	2024-11-26 14:00:00	2024-11-26 15:00:00	e56fed9a-c45c-4b02-9da6-11e2933772cc
1cedf927-cd76-4f07-a33e-396a66cd6240	THURSDAY	2024-11-27 14:00:00	2024-11-27 15:00:00	e56fed9a-c45c-4b02-9da6-11e2933772cc
01363989-71e1-41f1-a5ee-ffbafaec1a37	FRIDAY	2024-11-28 14:00:00	2024-11-28 15:00:00	e56fed9a-c45c-4b02-9da6-11e2933772cc
b3cec7c0-03cc-47c3-a7df-9a2558874ab6	SATURDAY	2024-11-29 14:00:00	2024-11-29 15:00:00	e56fed9a-c45c-4b02-9da6-11e2933772cc
ae0747bc-835d-4ed6-87cb-437d87f8cbb8	SUNDAY	2024-11-30 14:00:00	2024-11-30 15:00:00	e56fed9a-c45c-4b02-9da6-11e2933772cc
92156816-3894-4115-a7c4-ce27045d9f37	MONDAY	2024-11-24 14:00:00	2024-11-24 15:00:00	25be9528-cbae-489e-aeda-898aa87dc710
45362198-758e-4f2a-b947-73da70fc32e6	TUESDAY	2024-11-25 14:00:00	2024-11-25 15:00:00	25be9528-cbae-489e-aeda-898aa87dc710
d5561888-43d9-4c7e-b186-3e6398aa72f2	WEDNESDAY	2024-11-26 14:00:00	2024-11-26 15:00:00	25be9528-cbae-489e-aeda-898aa87dc710
db0b95da-c9fa-4159-827f-2b50bdd11382	THURSDAY	2024-11-27 14:00:00	2024-11-27 15:00:00	25be9528-cbae-489e-aeda-898aa87dc710
8c8f51cf-be52-45bb-b0eb-2b1d67922a7d	FRIDAY	2024-11-28 14:00:00	2024-11-28 15:00:00	25be9528-cbae-489e-aeda-898aa87dc710
969252c5-5e70-4744-947d-80e94b77ca13	SATURDAY	2024-11-29 14:00:00	2024-11-29 15:00:00	25be9528-cbae-489e-aeda-898aa87dc710
2297ee77-4da5-4ec0-9265-6aed082263cd	SUNDAY	2024-11-30 14:00:00	2024-11-30 15:00:00	25be9528-cbae-489e-aeda-898aa87dc710
f84cc1db-6beb-4f05-8438-d291279f7570	MONDAY	2024-11-24 14:00:00	2024-11-24 15:00:00	66c1e706-35df-478e-98b5-424d626716fd
c68ca583-ed56-4d7b-8cb0-343fdb10dc53	TUESDAY	2024-11-25 14:00:00	2024-11-25 15:00:00	66c1e706-35df-478e-98b5-424d626716fd
ce68727c-73e9-455f-8d2b-d5cc19876d54	WEDNESDAY	2024-11-26 14:00:00	2024-11-26 15:00:00	66c1e706-35df-478e-98b5-424d626716fd
d9a2b81e-7ee3-46f3-a0b5-18183d60339c	THURSDAY	2024-11-27 14:00:00	2024-11-27 15:00:00	66c1e706-35df-478e-98b5-424d626716fd
6dcc9c8d-89e1-480e-8b2b-46ab15abd754	FRIDAY	2024-11-28 14:00:00	2024-11-28 15:00:00	66c1e706-35df-478e-98b5-424d626716fd
d408ee9b-5da8-4e7b-a224-a0ab8a97d48e	SATURDAY	2024-11-29 14:00:00	2024-11-29 15:00:00	66c1e706-35df-478e-98b5-424d626716fd
40fe17e6-0751-42d6-8656-deaaa5aa6376	SUNDAY	2024-11-30 14:00:00	2024-11-30 15:00:00	66c1e706-35df-478e-98b5-424d626716fd
0850b301-efa7-4a79-afbf-77e8bd2c956b	MONDAY	2024-11-24 14:00:00	2024-11-24 15:00:00	c522462f-d09f-4a32-8198-2ff1c8d0bfb1
aa421d07-b38e-4d7a-85da-1b5b8edb84b6	TUESDAY	2024-11-25 14:00:00	2024-11-25 15:00:00	c522462f-d09f-4a32-8198-2ff1c8d0bfb1
10e833ac-ef51-4c4f-82a4-7a8e38bc810b	WEDNESDAY	2024-11-26 14:00:00	2024-11-26 15:00:00	c522462f-d09f-4a32-8198-2ff1c8d0bfb1
582ec7a5-cdde-49ca-ac4a-d0475331f191	THURSDAY	2024-11-27 14:00:00	2024-11-27 15:00:00	c522462f-d09f-4a32-8198-2ff1c8d0bfb1
cc197c77-8daf-4fc7-abe7-a095b957ec29	FRIDAY	2024-11-28 14:00:00	2024-11-28 15:00:00	c522462f-d09f-4a32-8198-2ff1c8d0bfb1
f3f8f713-f970-492b-b09f-d2ed6ae0d744	SATURDAY	2024-11-29 14:00:00	2024-11-29 15:00:00	c522462f-d09f-4a32-8198-2ff1c8d0bfb1
90307367-8b48-40e9-a557-e86b2e9d63e6	SUNDAY	2024-11-30 14:00:00	2024-11-30 15:00:00	c522462f-d09f-4a32-8198-2ff1c8d0bfb1
c2234b46-a92d-467b-8731-789ed0fbf887	MONDAY	2024-11-24 14:00:00	2024-11-24 15:00:00	b6d6b4cf-35b7-464b-8019-3badcb55aead
11e92243-8a73-464f-9f24-c6fb217452ca	TUESDAY	2024-11-25 14:00:00	2024-11-25 15:00:00	b6d6b4cf-35b7-464b-8019-3badcb55aead
0eaf6af0-7002-4112-900e-e1faeebaf527	WEDNESDAY	2024-11-26 14:00:00	2024-11-26 15:00:00	b6d6b4cf-35b7-464b-8019-3badcb55aead
2c2b0db7-5eb2-40db-adb2-00b60c911865	THURSDAY	2024-11-27 14:00:00	2024-11-27 15:00:00	b6d6b4cf-35b7-464b-8019-3badcb55aead
e667d9df-e5da-4ed1-95c0-90f502d922e8	FRIDAY	2024-11-28 14:00:00	2024-11-28 15:00:00	b6d6b4cf-35b7-464b-8019-3badcb55aead
0bbd8323-162d-4137-89d8-7f3b6b2633db	SATURDAY	2024-11-29 14:00:00	2024-11-29 15:00:00	b6d6b4cf-35b7-464b-8019-3badcb55aead
ce820e04-8427-4e7b-8cdd-117ce75e3a5f	SUNDAY	2024-11-30 14:00:00	2024-11-30 15:00:00	b6d6b4cf-35b7-464b-8019-3badcb55aead
831a4552-b568-45e6-b60a-70d1df048163	MONDAY	2024-11-24 14:00:00	2024-11-24 15:00:00	923b4aa5-1df0-4677-b7ed-0f9abf327fad
7f2c0f36-7c06-4a08-b981-386de9810ab8	TUESDAY	2024-11-25 14:00:00	2024-11-25 15:00:00	923b4aa5-1df0-4677-b7ed-0f9abf327fad
0704ad4f-2022-4a10-a3fe-f85ad05011b8	WEDNESDAY	2024-11-26 14:00:00	2024-11-26 15:00:00	923b4aa5-1df0-4677-b7ed-0f9abf327fad
6afcf0d3-0b16-4c5a-b2fc-428d6dd2ede0	THURSDAY	2024-11-27 14:00:00	2024-11-27 15:00:00	923b4aa5-1df0-4677-b7ed-0f9abf327fad
caf0bf72-b8d9-4275-ba24-22b09ad84839	FRIDAY	2024-11-28 14:00:00	2024-11-28 15:00:00	923b4aa5-1df0-4677-b7ed-0f9abf327fad
1a8df806-aadf-4ecf-a87c-21d3885cf5f3	SATURDAY	2024-11-29 14:00:00	2024-11-29 15:00:00	923b4aa5-1df0-4677-b7ed-0f9abf327fad
c3b4d34e-f3ce-4d62-9658-1d54e346e2bd	SUNDAY	2024-11-30 14:00:00	2024-11-30 15:00:00	923b4aa5-1df0-4677-b7ed-0f9abf327fad
1ccebe12-c0cc-464d-9adf-30ebf957ee33	MONDAY	2024-11-24 14:00:00	2024-11-24 15:00:00	4d1fe34e-64eb-4dc3-945c-50a45b1a8462
1c059334-c341-48a5-94eb-fb1284002c90	TUESDAY	2024-11-25 14:00:00	2024-11-25 15:00:00	4d1fe34e-64eb-4dc3-945c-50a45b1a8462
1d4f2336-fcdf-40bb-94cf-092ff87788c9	WEDNESDAY	2024-11-26 14:00:00	2024-11-26 15:00:00	4d1fe34e-64eb-4dc3-945c-50a45b1a8462
33f4a838-96c3-48c8-8bfd-d2ecfcd4b5a1	THURSDAY	2024-11-27 14:00:00	2024-11-27 15:00:00	4d1fe34e-64eb-4dc3-945c-50a45b1a8462
c42e6d07-00e1-4272-87ee-4bbc845699a0	FRIDAY	2024-11-28 14:00:00	2024-11-28 15:00:00	4d1fe34e-64eb-4dc3-945c-50a45b1a8462
adaf09ff-d14f-46c9-935b-69628ec1f1c5	SATURDAY	2024-11-29 14:00:00	2024-11-29 15:00:00	4d1fe34e-64eb-4dc3-945c-50a45b1a8462
81df18f8-0e4b-4307-9b0e-11f4d103205e	SUNDAY	2024-11-30 14:00:00	2024-11-30 15:00:00	4d1fe34e-64eb-4dc3-945c-50a45b1a8462
b1bfa127-bcee-4431-a6fe-4f317a181b88	MONDAY	2024-11-24 14:00:00	2024-11-24 15:00:00	1ad25111-b805-49da-a9b9-1f603efb4123
847d9cba-f6bc-4095-8bfc-e4810a641e61	TUESDAY	2024-11-25 14:00:00	2024-11-25 15:00:00	1ad25111-b805-49da-a9b9-1f603efb4123
11cc451e-58ed-4369-b4dd-bb4777c8c4ee	WEDNESDAY	2024-11-26 14:00:00	2024-11-26 15:00:00	1ad25111-b805-49da-a9b9-1f603efb4123
edea87a8-74aa-47a8-ab24-3f4225c36353	THURSDAY	2024-11-27 14:00:00	2024-11-27 15:00:00	1ad25111-b805-49da-a9b9-1f603efb4123
a15639ac-fe0e-47ff-aeb7-8a5c816d3c86	FRIDAY	2024-11-28 14:00:00	2024-11-28 15:00:00	1ad25111-b805-49da-a9b9-1f603efb4123
b9d52528-27ce-467d-ad35-8e38253e30d1	SATURDAY	2024-11-29 14:00:00	2024-11-29 15:00:00	1ad25111-b805-49da-a9b9-1f603efb4123
b0970c67-f23b-49fd-b04d-fcfd2981f946	SUNDAY	2024-11-30 14:00:00	2024-11-30 15:00:00	1ad25111-b805-49da-a9b9-1f603efb4123
\.


--
-- Data for Name: GastoCapital; Type: TABLE DATA; Schema: public; Owner: donaldcross
--

COPY public."GastoCapital" (id, amount, description, date, "capitalSocialId") FROM stdin;
\.


--
-- Data for Name: IngresoCapital; Type: TABLE DATA; Schema: public; Owner: donaldcross
--

COPY public."IngresoCapital" (id, amount, description, date, "capitalSocialId") FROM stdin;
\.


--
-- Data for Name: Junta; Type: TABLE DATA; Schema: public; Owner: donaldcross
--

COPY public."Junta" (id, name, description, fecha_inicio, "createdAt", "updatedAt", "createdById", available_capital, base_capital, current_capital) FROM stdin;
9aee4d9a-0b00-4fee-b89c-2c28434c81c2	Primera Junta	\N	2024-12-05 00:00:00	2024-12-05 17:24:30.018	2024-12-16 21:04:43.971	272a402c-9d70-4371-96f2-8f3d68f37717	15664.312475053368	500	15664.312475053368
\.


--
-- Data for Name: JuntaMember; Type: TABLE DATA; Schema: public; Owner: donaldcross
--

COPY public."JuntaMember" (id, "juntaId", "userId", "joinedAt") FROM stdin;
1a95740c-719a-4bc7-8112-418c22eba881	9aee4d9a-0b00-4fee-b89c-2c28434c81c2	272a402c-9d70-4371-96f2-8f3d68f37717	2024-12-05 17:24:30.022
2344ccfd-d65c-45cf-ae76-7a953efb8769	9aee4d9a-0b00-4fee-b89c-2c28434c81c2	1cdf1729-984f-4d0c-bf3e-af4426d71d16	2024-12-05 17:30:48.351
\.


--
-- Data for Name: Multa; Type: TABLE DATA; Schema: public; Owner: donaldcross
--

COPY public."Multa" (id, amount, description, status, "createdAt", "updatedAt", "juntaId", "memberId", affects_capital, "agendaItemId") FROM stdin;
\.


--
-- Data for Name: PagoPrestamo; Type: TABLE DATA; Schema: public; Owner: donaldcross
--

COPY public."PagoPrestamo" (id, amount, date, "prestamoId") FROM stdin;
\.


--
-- Data for Name: PagoPrestamoNew; Type: TABLE DATA; Schema: public; Owner: donaldcross
--

COPY public."PagoPrestamoNew" (id, amount, date, "prestamoId", original_pago_id, affects_capital, "agendaItemId", capital_amount, interest_amount, installment_number) FROM stdin;
0e2ca98f-1382-469b-9d83-d2d1760bde40	29.9	2024-12-16 21:04:22.147	9fed6730-9d59-4c7a-a1a6-127591ff62b4	\N	t	\N	26	3.9	1
ecb9e759-491e-4fcb-80ca-7388b5c9ad15	29.9	2024-12-16 21:04:28.588	9fed6730-9d59-4c7a-a1a6-127591ff62b4	\N	t	\N	26	3.9	2
1fe9ebaf-a706-46b8-b382-114d429587d9	29.9	2024-12-16 21:04:33.731	9fed6730-9d59-4c7a-a1a6-127591ff62b4	\N	t	\N	26	3.9	3
58329ea3-c1ef-4fd1-a3a8-cd82f811e311	29.9	2024-12-16 21:04:38.174	9fed6730-9d59-4c7a-a1a6-127591ff62b4	\N	t	\N	26	3.9	4
ec27ad90-6feb-4107-94c3-899f83536d7e	29.9	2024-12-16 21:04:43.973	9fed6730-9d59-4c7a-a1a6-127591ff62b4	\N	t	\N	26	3.9	5
\.


--
-- Data for Name: PaymentSchedule; Type: TABLE DATA; Schema: public; Owner: donaldcross
--

COPY public."PaymentSchedule" (id, due_date, expected_amount, principal, interest, installment_number, status, "createdAt", "updatedAt", "prestamoId", remaining_balance, paid_amount, "loanAmount") FROM stdin;
6d8f74e6-ba61-4690-b08c-69caef3fb2dd	2025-01-15 00:00:00	29.9	26	3.9	1	PAID	2024-12-16 21:04:08.143	2024-12-16 21:04:22.147	9fed6730-9d59-4c7a-a1a6-127591ff62b4	104	29.9	130
14c6fb28-450a-46f5-8e63-dea91093be5a	2025-02-14 00:00:00	29.9	26	3.9	2	PAID	2024-12-16 21:04:08.143	2024-12-16 21:04:28.588	9fed6730-9d59-4c7a-a1a6-127591ff62b4	78	29.9	130
0144c87b-6168-4d0b-8124-3bce58c7b88f	2025-03-16 00:00:00	29.9	26	3.9	3	PAID	2024-12-16 21:04:08.143	2024-12-16 21:04:33.731	9fed6730-9d59-4c7a-a1a6-127591ff62b4	52	29.9	130
aa085b77-27dc-4c18-95f6-b6a3d93173fd	2025-04-15 00:00:00	29.9	26	3.9	4	PAID	2024-12-16 21:04:08.143	2024-12-16 21:04:38.174	9fed6730-9d59-4c7a-a1a6-127591ff62b4	26	29.9	130
3b3763d1-fa5d-403f-8512-649f92d8d4e8	2025-05-15 00:00:00	29.9	26	3.9	5	PAID	2024-12-16 21:04:08.143	2024-12-16 21:04:43.973	9fed6730-9d59-4c7a-a1a6-127591ff62b4	0	29.9	130
\.


--
-- Data for Name: PerformanceMetric; Type: TABLE DATA; Schema: public; Owner: donaldcross
--

COPY public."PerformanceMetric" (id, type, value, pathname, "searchParams", "timestamp", "navigationStart", "navigationDuration", "elementId", "elementTag", url, "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: Prestamo; Type: TABLE DATA; Schema: public; Owner: donaldcross
--

COPY public."Prestamo" (id, amount, description, status, "createdAt", "updatedAt", "juntaId", "memberId") FROM stdin;
\.


--
-- Data for Name: PrestamoNew; Type: TABLE DATA; Schema: public; Owner: donaldcross
--

COPY public."PrestamoNew" (id, amount, description, status, request_date, monthly_interest, number_of_installments, approved, rejected, rejection_reason, paid, remaining_amount, "createdAt", "updatedAt", "juntaId", "memberId", original_prestamo_id, affects_capital, "avalId", capital_at_time, capital_snapshot, form_cost, form_purchased, guarantee_detail, guarantee_type, loan_code, loan_number, payment_type, reason, loan_type, "agendaItemId") FROM stdin;
9fed6730-9d59-4c7a-a1a6-127591ff62b4	130	\N	PAID	2024-12-16 00:00:00	3	5	f	f	\N	t	0	2024-12-16 21:04:08.143	2024-12-16 21:04:43.973	9aee4d9a-0b00-4fee-b89c-2c28434c81c2	1cdf1729-984f-4d0c-bf3e-af4426d71d16	\N	t	\N	15644.81247505337	"{\\"current_capital\\":15644.81247505337,\\"base_capital\\":500,\\"available_capital\\":15514.81247505337,\\"calculation\\":{\\"monthly_payment\\":29.9,\\"total_payment\\":149.5,\\"total_interest\\":19.5,\\"amortization_schedule\\":[{\\"payment\\":29.9,\\"principal\\":26,\\"interest\\":3.9,\\"balance\\":104},{\\"payment\\":29.9,\\"principal\\":26,\\"interest\\":3.9,\\"balance\\":78},{\\"payment\\":29.9,\\"principal\\":26,\\"interest\\":3.9,\\"balance\\":52},{\\"payment\\":29.9,\\"principal\\":26,\\"interest\\":3.9,\\"balance\\":26},{\\"payment\\":29.9,\\"principal\\":26,\\"interest\\":3.9,\\"balance\\":0}]}}"	0	f		AVAL	CUOTA_FIJA-1734383048143	1	MENSUAL		CUOTA_FIJA	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: donaldcross
--

COPY public."User" (id, email, username, password, role, document_type, document_number, full_name, birth_date, address, "createdAt", "updatedAt", phone, additional_info, beneficiary_address, beneficiary_document_number, beneficiary_document_type, beneficiary_full_name, beneficiary_phone, gender, join_date, member_role, productive_activity, status) FROM stdin;
323ade74-1c0f-48a3-a67f-bded5328b72f	\N	user	$2b$10$fTKbNDPlJqtFgSg/hyh14uVjnS69CV0/x1FY6vSSgDqRszORL6Nzi	USER	\N	\N	\N	\N	\N	2024-11-28 07:42:50.066	2024-11-28 07:42:50.066	912345678	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Activo
795354a0-47d5-4e5d-853c-68ecefe7771c	\N	admin	$2b$10$DlxUKSrj/ySuBKA5OnlSj.13F.1fcD3hy4en6HvHx3MnB8NR6k45S	USER	\N	\N	\N	\N	\N	2024-11-28 07:45:19.942	2024-11-28 07:45:19.942	987654321	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Activo
272a402c-9d70-4371-96f2-8f3d68f37717	\N	admin1	$2b$10$LgRHNlmosxpfE1iFjCN9TOsnEOlv4Pq6aSoNJ2nRoJSNP0UdLE8/W	ADMIN	\N	\N	\N	\N	\N	2024-11-28 07:47:22.528	2024-11-28 07:47:22.528	987654322	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Activo
86567b9d-9fa0-4543-b650-c926064de39c	07877785@example.com	user_07877785	$2b$10$Q1Lf.8C5a81.yIXAw7PYnO4WSQ6DAdbTLdo1bbDATr9fSoL4sYcbO	USER	DNI	07877785	Carmen Carpio	1972-11-28 00:00:00	Av. Gral. Córdova 265	2024-11-28 09:11:05.738	2024-11-28 09:11:05.738	984722384	Jacinto Huaman	La Mar 221	02345678	DNI	Jacinto Huaman	912345678	Masculino	2024-11-28 00:00:00	socio	Ama de casa	Activo
430fdfe0-89e7-47e1-bfb6-a3efd2c2541d	07877783@example.com	user_07877783	$2b$10$1N5xReCIkGQHPKLnqfom5ONKTwNuEGuff68AV7mMz0svLaGdeaCW6	USER	DNI	07877783	Jose Luque	1972-11-28 00:00:00	La Mar 221	2024-11-28 10:30:41.818	2024-11-28 10:30:41.818	984722777	984722777	La Mar 221	02345678	DNI	Jose Luque	984722777	Masculino	2024-11-28 00:00:00	socio	Economista	Activo
38d4ef11-541c-43c1-9f2c-e48418ef3f70	07877781@example.com	user_07877781	$2b$10$LnOMna.bsUAuZKaFqCmBHO.aEK8RTP12cFLhb04aD7mBN2uXoU5a2	USER	DNI	07877781	Jose Luque	1972-11-28 00:00:00	La Mar 221	2024-11-28 09:58:57.983	2024-11-28 10:31:34.027	907050001	907050001	La Mar 221	07877788	DNI	Donald Derek Cross	984722384	Masculino	2024-11-28 00:00:00	socio	Economista	Activo
cda65cb7-3e75-4ef1-914d-5599e53fea4b	07877766@example.com	user_07877766	$2b$10$COD7EwDFnzX26cI7gfqLPOukMX1AtYhfKKgcqSnDxb0Kuvpxmng5u	USER	DNI	07877766	Donald Derek Cross	1972-11-28 00:00:00	6586 Atlantic Ave	2024-11-28 13:46:22.709	2024-11-28 13:47:07.775	907050001	aaaa	La Mar 221	07877788	DNI	Jose Luque	912345678	Masculino	2024-11-28 00:00:00	socio	Developer	Activo
a14d0aaa-9f9e-4181-a84b-6464a8b57c71	\N	derek	$2b$10$9nJXWwnTESNIR3PecBdUBu5Ah4421w27FfRvCyPA16pAs3AE.WiB.	ADMIN	\N	\N	\N	\N	\N	2024-11-29 18:35:18.894	2024-11-29 18:35:18.894	123456789	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Activo
e27dcc80-48a3-49df-a724-6f31b04bf0be	12345678@example.com	user_12345678	$2b$10$jC2fm42gFAyfMu68MuqMHO5b90yZI6wZcxFNr2.KCPVdcZiviwNq2	USER	DNI	12345678	Jacinto Huaman	1972-11-28 00:00:00	987654322	2024-11-28 08:46:26.478	2024-11-29 18:36:32.279	907050000	907050000	La Mar 221	02345678	DNI	Tina Camacho	907050001	Masculino	2024-11-28 00:00:00	socio	Guia	Activo
77de16e6-f0a9-4058-ba8a-5e2cc24c01eb	87877701@example.com	user_87877701	$2b$10$smTOyU29dq2zoomp/qMVduoHa8e7fYOi20dg6lQ8AeHiZTAxQq3Ia	USER	DNI	87877701	Maria Ruedas	1972-11-29 00:00:00	aaaaaaaa	2024-11-29 20:01:23.154	2024-11-29 20:01:23.154	907050301	aaaaa	aaaqaaa	07877781	DNI	kike Topo	907050302	Masculino	2024-11-29 00:00:00	socio	Cevicheria	Activo
a6e613bd-f40d-4cbb-9445-95328dc596be	99110033@example.com	user_99110033	$2b$10$eLuj6nG.gpd/5.s35lPMT.//dFeMWPHn.bUkQpPJe4mUnPslI1cE6	USER	DNI	99110033	Kike Topo	1972-11-29 00:00:00	987654322	2024-11-29 21:31:00.475	2024-11-29 21:31:00.475	984722382	aaa	a	07877759	DNI	kike Topo	907050302	Masculino	2024-11-29 00:00:00	socio	Carpintero	Activo
74379e8c-b977-404b-85a8-2828a1c44b53	07877701@example.com	user_07877701	$2b$10$9hYgFtEiDOMdGLpSZhsziONGw8y3XETU8n5PGgAmbZjN1nL/vfutW	USER	DNI	07877701	Ricardo Gavilan	1972-11-29 00:00:00	987654322	2024-11-29 22:41:05.876	2024-11-29 22:41:05.876	984722382	sss	sss	07877759	DNI	Ricardo Montero	907050302	Masculino	2024-11-29 00:00:00	socio	Carpintero	Activo
583103ad-6e21-42fa-9f2a-59364e5838a3	81818181@example.com	user_81818181	$2b$10$xNGoGalUPEqIs8riUMXr4e60RT0aH3K08FK60XWZzteWy9ObxxviG	USER	DNI	81818181	Kike Lengua	1972-12-03 00:00:00	987654322	2024-12-03 16:41:43.491	2024-12-03 16:41:43.491	907050000	000	La Mar 221	07877788	DNI	Jose Luque	912345678	Masculino	2024-12-03 00:00:00	socio	Pescador	Activo
5349dd1e-47d5-45e0-a867-b79786dedab0	81545454@example.com	user_81545454	$2b$10$M77p81.fIaBgXix2Wa8bIeEw72LTwaxOLnESOe5dyC0k/Bax47O7C	USER	DNI	81545454	Almendra Cocina	1988-12-03 00:00:00	987654322	2024-12-03 16:51:19.11	2024-12-03 16:51:19.11	907050000	907050000	La Mar 221	02345678	DNI	Jose Luque	912345678	Femenino	2024-12-03 00:00:00	socio	Ama de casa	Activo
1cdf1729-984f-4d0c-bf3e-af4426d71d16	11223344@example.com	user_11223344	$2b$10$wbb3r3cOhYCehtV73v.1E.G6vM1VsO3eN/ycTG.00QOxw7iPNUzSq	USER	DNI	11223344	Olenka	1972-12-05 00:00:00	aaa	2024-12-05 17:30:48.351	2024-12-05 17:30:48.351	907050000	907050000	La Mar 221	07877788	DNI	Jose Luque	912345678	Masculino	2024-12-05 00:00:00	socio	Ama de casa	Activo
ba97e1fa-2924-401f-b5ef-72976d338c01	81914151@example.com	user_81914151	$2b$10$p7RfyOrDJkUXxqZuusEkiuiaHpDouTl5dQm5kF944HePXTDiM.CaO	USER	DNI	81914151	Donald Derek Cross	1972-12-13 00:00:00	aaaa	2024-12-13 13:41:11.709	2024-12-13 13:41:11.709	912345678		6586 Atlantic Ave	07877788	DNI	Donald Derek Cross	912345678	Masculino	2024-12-13 00:00:00	socio	Economista	Activo
\.


--
-- Data for Name: _UserAgendaItems; Type: TABLE DATA; Schema: public; Owner: donaldcross
--

COPY public."_UserAgendaItems" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: donaldcross
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
84737730-35c0-42b4-b467-7b906701eb0c	9e482bf30cbbde91ec6db1ebde4e8bae92630b053c64ae4f08b8340c74f76132	2024-11-28 02:32:44.123224-05	20241120133146_asistencia_nuevaui	\N	\N	2024-11-28 02:32:44.116521-05	1
86bd7953-e453-4a8f-b1cd-a1c47ed13ec6	582869aebb8e263a39691dc7fc519ce7db5d0192294813aa02d35acc6c5d2a35	2024-11-28 02:32:44.05073-05	20241027122736_init	\N	\N	2024-11-28 02:32:44.029746-05	1
eb6c8a27-7496-4142-9ed7-ca61ba14fee7	7f1355468e02ecb16995816bbc1a86cac2e74d084d2fd5128aa664bade239ada	2024-11-28 02:32:44.052814-05	20241027131415_add_phone_number	\N	\N	2024-11-28 02:32:44.051185-05	1
1a46d38c-01ef-42fa-9a3d-d86b31c24932	0f1ef628653dafb0e0b3041855461f0a2bfea777d02aad0ff1ee95ed16d1e5ac	2024-11-28 02:32:44.054198-05	20241027131758_update_user_fields	\N	\N	2024-11-28 02:32:44.053186-05	1
b6fefa0c-bc11-46bf-b7dd-92cb113b0168	48034c5e628bc48b4023b9eb8807e962174db5b1b411643ff86be0cd14178a09	2024-12-03 05:30:52.632165-05	20241129231926_nuevaui_update_friday_29_11_2024	\N	\N	2024-12-03 05:30:52.625132-05	1
269d4cea-adb0-42d5-a7b7-42ddbf8978db	25fbf37996f612ef8d891426c437299bb16d3f9aadec97fb2be5f813e00e6aec	2024-11-28 02:32:44.057064-05	20241029150245_add_member_fields	\N	\N	2024-11-28 02:32:44.054559-05	1
19a3bb60-2045-452f-8fdc-6804811554a8	0bbf1d284c10a37a06824f5efdabf5b442593197b69c6620e5b66d5cb57a9232	2024-11-28 02:32:44.063288-05	20241101122254_add_prestamos_shadow_tables	\N	\N	2024-11-28 02:32:44.057491-05	1
61c08721-dd64-4cda-8a14-d342be20fda7	66304a5f362fdcc9f64dd8c38e58e02a8c5d321824c516ee7379a53d9b46bd11	2024-11-28 02:32:44.073269-05	20241101164803_dev2	\N	\N	2024-11-28 02:32:44.063869-05	1
3c858361-c353-443e-8655-ddf4c770f1f2	1d3029a7fe560a01e5fbe9b21b000dd129696f426221cb39f2c04b39396fd4a2	2024-12-03 05:32:22.102289-05	20241203103222_added_schedule_balance	\N	\N	2024-12-03 05:32:22.100463-05	1
df073a29-67f6-4f06-b430-e5caf020bd78	c988d8c9c1a0c204a64233dedc0550798a94889bc28041fa012f45c17411364e	2024-11-28 02:32:44.074685-05	20241101220000_add_loan_type	\N	\N	2024-11-28 02:32:44.073596-05	1
c3068edd-dd33-450c-963d-d4b7fbecceb5	6c1e8e17e9793895bb54bb4aca296a5d7dafc397eff3987fd182e672a07db3dd	2024-11-28 02:32:44.076292-05	20241101231110_add_loan_type	\N	\N	2024-11-28 02:32:44.075044-05	1
1ec4d492-ab9e-47a9-9019-717fb09f9073	17dfdaa657ee70764cf81a49cc3a2499ba742dd0d54630a8e81e8fc78073185b	2024-11-28 02:32:44.077561-05	20241102174927_share_value	\N	\N	2024-11-28 02:32:44.076566-05	1
7fb4ea8e-f479-46c2-81fd-9855a1f63a66	e9f4555dea16ea5132d190a6f373098b6ed418a304239f7d49d5fc7e5daa0544	2024-12-03 07:06:55.337013-05	20241203120655_add_paid_amount_to_payment_schedule	\N	\N	2024-12-03 07:06:55.334698-05	1
65b83728-a2be-4cf8-ba93-cc8e38fc6b57	b8211d4516d6b9694065366ae359f2929526cfd41844211d2639762f5ce63913	2024-11-28 02:32:44.082144-05	20241103235837_add_payment_schedule	\N	\N	2024-11-28 02:32:44.077866-05	1
dbcbe4b3-7cf7-4a0c-8c86-9a871ada19d3	2eb46bb087ff68271204289a590d80669d9c0d93dae193010624c8c49b2ed0e6	2024-11-28 02:32:44.100559-05	20241116150135_nuevaui	\N	\N	2024-11-28 02:32:44.082703-05	1
d1db0bfd-7403-4e43-bed6-f2f3712d3e0a	665f723bbb49fd9747f3293de206ce42fa1c8f0666ef393360a7c52bca1d2b00	2024-11-28 02:32:44.106431-05	20241118172235_add_weekly_schedule	\N	\N	2024-11-28 02:32:44.101005-05	1
f6162ec4-6722-4ae2-b0d9-a9a7b0bc04bb	4b46c847c32db7cacb41b3b7400ef17ecd303bcbc7c7d3fd48ac078d4e3a5081	2024-12-03 10:32:31.404637-05	20241203153231_loan_amount	\N	\N	2024-12-03 10:32:31.401893-05	1
29d5c6ca-c685-403b-bb62-22b15f9b65e6	124c065f30f7c0d8f76cffa792993a684aa1bc6858fb7f0c6c0b1bb2b37aebaa	2024-11-28 02:32:44.116112-05	20241120132616_asistencia	\N	\N	2024-11-28 02:32:44.106807-05	1
1b8a5f38-7958-4828-a31a-7c9f54b55b60	d19921e8e97835108c0c98a86000b3f6dbf7180bcc77474e78d96da6ffbc2ee2	2024-12-08 08:27:05.591254-05	20241208132705_pago_capital_interest_amount	\N	\N	2024-12-08 08:27:05.58673-05	1
8f4772ef-ed3c-43e2-a16a-ceba3fa59ea5	bfdbd005182a0728fa89057cdf4a34fb75b3a4b19d0aa67658f40b8137f7bc93	2024-12-11 12:49:49.551365-05	20241211174949_installment_number	\N	\N	2024-12-11 12:49:49.549577-05	1
\.


--
-- Name: PerformanceMetric_id_seq; Type: SEQUENCE SET; Schema: public; Owner: donaldcross
--

SELECT pg_catalog.setval('public."PerformanceMetric_id_seq"', 1, false);


--
-- Name: Accion Accion_pkey; Type: CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."Accion"
    ADD CONSTRAINT "Accion_pkey" PRIMARY KEY (id);


--
-- Name: AgendaItem AgendaItem_pkey; Type: CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."AgendaItem"
    ADD CONSTRAINT "AgendaItem_pkey" PRIMARY KEY (id);


--
-- Name: CapitalMovement CapitalMovement_pkey; Type: CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."CapitalMovement"
    ADD CONSTRAINT "CapitalMovement_pkey" PRIMARY KEY (id);


--
-- Name: CapitalSocial CapitalSocial_pkey; Type: CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."CapitalSocial"
    ADD CONSTRAINT "CapitalSocial_pkey" PRIMARY KEY (id);


--
-- Name: DailyAttendance DailyAttendance_pkey; Type: CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."DailyAttendance"
    ADD CONSTRAINT "DailyAttendance_pkey" PRIMARY KEY (id);


--
-- Name: DaySchedule DaySchedule_pkey; Type: CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."DaySchedule"
    ADD CONSTRAINT "DaySchedule_pkey" PRIMARY KEY (id);


--
-- Name: GastoCapital GastoCapital_pkey; Type: CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."GastoCapital"
    ADD CONSTRAINT "GastoCapital_pkey" PRIMARY KEY (id);


--
-- Name: IngresoCapital IngresoCapital_pkey; Type: CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."IngresoCapital"
    ADD CONSTRAINT "IngresoCapital_pkey" PRIMARY KEY (id);


--
-- Name: JuntaMember JuntaMember_pkey; Type: CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."JuntaMember"
    ADD CONSTRAINT "JuntaMember_pkey" PRIMARY KEY (id);


--
-- Name: Junta Junta_pkey; Type: CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."Junta"
    ADD CONSTRAINT "Junta_pkey" PRIMARY KEY (id);


--
-- Name: Multa Multa_pkey; Type: CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."Multa"
    ADD CONSTRAINT "Multa_pkey" PRIMARY KEY (id);


--
-- Name: PagoPrestamoNew PagoPrestamoNew_pkey; Type: CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."PagoPrestamoNew"
    ADD CONSTRAINT "PagoPrestamoNew_pkey" PRIMARY KEY (id);


--
-- Name: PagoPrestamo PagoPrestamo_pkey; Type: CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."PagoPrestamo"
    ADD CONSTRAINT "PagoPrestamo_pkey" PRIMARY KEY (id);


--
-- Name: PaymentSchedule PaymentSchedule_pkey; Type: CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."PaymentSchedule"
    ADD CONSTRAINT "PaymentSchedule_pkey" PRIMARY KEY (id);


--
-- Name: PerformanceMetric PerformanceMetric_pkey; Type: CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."PerformanceMetric"
    ADD CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY (id);


--
-- Name: PrestamoNew PrestamoNew_pkey; Type: CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."PrestamoNew"
    ADD CONSTRAINT "PrestamoNew_pkey" PRIMARY KEY (id);


--
-- Name: Prestamo Prestamo_pkey; Type: CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."Prestamo"
    ADD CONSTRAINT "Prestamo_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Accion_agendaItemId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "Accion_agendaItemId_idx" ON public."Accion" USING btree ("agendaItemId");


--
-- Name: Accion_juntaId_createdAt_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "Accion_juntaId_createdAt_idx" ON public."Accion" USING btree ("juntaId", "createdAt");


--
-- Name: Accion_memberId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "Accion_memberId_idx" ON public."Accion" USING btree ("memberId");


--
-- Name: AgendaItem_juntaId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "AgendaItem_juntaId_idx" ON public."AgendaItem" USING btree ("juntaId");


--
-- Name: CapitalMovement_accionId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "CapitalMovement_accionId_idx" ON public."CapitalMovement" USING btree ("accionId");


--
-- Name: CapitalMovement_juntaId_createdAt_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "CapitalMovement_juntaId_createdAt_idx" ON public."CapitalMovement" USING btree ("juntaId", "createdAt");


--
-- Name: CapitalMovement_multaId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "CapitalMovement_multaId_idx" ON public."CapitalMovement" USING btree ("multaId");


--
-- Name: CapitalMovement_pagoId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "CapitalMovement_pagoId_idx" ON public."CapitalMovement" USING btree ("pagoId");


--
-- Name: CapitalMovement_prestamoId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "CapitalMovement_prestamoId_idx" ON public."CapitalMovement" USING btree ("prestamoId");


--
-- Name: CapitalMovement_type_direction_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "CapitalMovement_type_direction_idx" ON public."CapitalMovement" USING btree (type, direction);


--
-- Name: CapitalSocial_juntaId_key; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE UNIQUE INDEX "CapitalSocial_juntaId_key" ON public."CapitalSocial" USING btree ("juntaId");


--
-- Name: DailyAttendance_agendaItemId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "DailyAttendance_agendaItemId_idx" ON public."DailyAttendance" USING btree ("agendaItemId");


--
-- Name: DailyAttendance_dayScheduleId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "DailyAttendance_dayScheduleId_idx" ON public."DailyAttendance" USING btree ("dayScheduleId");


--
-- Name: DailyAttendance_userId_agendaItemId_dayScheduleId_key; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE UNIQUE INDEX "DailyAttendance_userId_agendaItemId_dayScheduleId_key" ON public."DailyAttendance" USING btree ("userId", "agendaItemId", "dayScheduleId");


--
-- Name: DailyAttendance_userId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "DailyAttendance_userId_idx" ON public."DailyAttendance" USING btree ("userId");


--
-- Name: DaySchedule_agendaItemId_dayOfWeek_key; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE UNIQUE INDEX "DaySchedule_agendaItemId_dayOfWeek_key" ON public."DaySchedule" USING btree ("agendaItemId", "dayOfWeek");


--
-- Name: DaySchedule_agendaItemId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "DaySchedule_agendaItemId_idx" ON public."DaySchedule" USING btree ("agendaItemId");


--
-- Name: GastoCapital_capitalSocialId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "GastoCapital_capitalSocialId_idx" ON public."GastoCapital" USING btree ("capitalSocialId");


--
-- Name: IngresoCapital_capitalSocialId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "IngresoCapital_capitalSocialId_idx" ON public."IngresoCapital" USING btree ("capitalSocialId");


--
-- Name: JuntaMember_juntaId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "JuntaMember_juntaId_idx" ON public."JuntaMember" USING btree ("juntaId");


--
-- Name: JuntaMember_juntaId_userId_key; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE UNIQUE INDEX "JuntaMember_juntaId_userId_key" ON public."JuntaMember" USING btree ("juntaId", "userId");


--
-- Name: JuntaMember_userId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "JuntaMember_userId_idx" ON public."JuntaMember" USING btree ("userId");


--
-- Name: Junta_createdById_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "Junta_createdById_idx" ON public."Junta" USING btree ("createdById");


--
-- Name: Multa_agendaItemId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "Multa_agendaItemId_idx" ON public."Multa" USING btree ("agendaItemId");


--
-- Name: Multa_juntaId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "Multa_juntaId_idx" ON public."Multa" USING btree ("juntaId");


--
-- Name: Multa_memberId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "Multa_memberId_idx" ON public."Multa" USING btree ("memberId");


--
-- Name: PagoPrestamoNew_agendaItemId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "PagoPrestamoNew_agendaItemId_idx" ON public."PagoPrestamoNew" USING btree ("agendaItemId");


--
-- Name: PagoPrestamoNew_original_pago_id_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "PagoPrestamoNew_original_pago_id_idx" ON public."PagoPrestamoNew" USING btree (original_pago_id);


--
-- Name: PagoPrestamoNew_prestamoId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "PagoPrestamoNew_prestamoId_idx" ON public."PagoPrestamoNew" USING btree ("prestamoId");


--
-- Name: PagoPrestamo_prestamoId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "PagoPrestamo_prestamoId_idx" ON public."PagoPrestamo" USING btree ("prestamoId");


--
-- Name: PaymentSchedule_prestamoId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "PaymentSchedule_prestamoId_idx" ON public."PaymentSchedule" USING btree ("prestamoId");


--
-- Name: PerformanceMetric_type_timestamp_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "PerformanceMetric_type_timestamp_idx" ON public."PerformanceMetric" USING btree (type, "timestamp");


--
-- Name: PrestamoNew_agendaItemId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "PrestamoNew_agendaItemId_idx" ON public."PrestamoNew" USING btree ("agendaItemId");


--
-- Name: PrestamoNew_avalId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "PrestamoNew_avalId_idx" ON public."PrestamoNew" USING btree ("avalId");


--
-- Name: PrestamoNew_juntaId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "PrestamoNew_juntaId_idx" ON public."PrestamoNew" USING btree ("juntaId");


--
-- Name: PrestamoNew_juntaId_loan_number_key; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE UNIQUE INDEX "PrestamoNew_juntaId_loan_number_key" ON public."PrestamoNew" USING btree ("juntaId", loan_number);


--
-- Name: PrestamoNew_memberId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "PrestamoNew_memberId_idx" ON public."PrestamoNew" USING btree ("memberId");


--
-- Name: Prestamo_juntaId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "Prestamo_juntaId_idx" ON public."Prestamo" USING btree ("juntaId");


--
-- Name: Prestamo_memberId_idx; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "Prestamo_memberId_idx" ON public."Prestamo" USING btree ("memberId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: _UserAgendaItems_AB_unique; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE UNIQUE INDEX "_UserAgendaItems_AB_unique" ON public."_UserAgendaItems" USING btree ("A", "B");


--
-- Name: _UserAgendaItems_B_index; Type: INDEX; Schema: public; Owner: donaldcross
--

CREATE INDEX "_UserAgendaItems_B_index" ON public."_UserAgendaItems" USING btree ("B");


--
-- Name: Accion Accion_agendaItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."Accion"
    ADD CONSTRAINT "Accion_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES public."AgendaItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Accion Accion_juntaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."Accion"
    ADD CONSTRAINT "Accion_juntaId_fkey" FOREIGN KEY ("juntaId") REFERENCES public."Junta"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Accion Accion_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."Accion"
    ADD CONSTRAINT "Accion_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AgendaItem AgendaItem_juntaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."AgendaItem"
    ADD CONSTRAINT "AgendaItem_juntaId_fkey" FOREIGN KEY ("juntaId") REFERENCES public."Junta"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CapitalMovement CapitalMovement_accionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."CapitalMovement"
    ADD CONSTRAINT "CapitalMovement_accionId_fkey" FOREIGN KEY ("accionId") REFERENCES public."Accion"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CapitalMovement CapitalMovement_juntaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."CapitalMovement"
    ADD CONSTRAINT "CapitalMovement_juntaId_fkey" FOREIGN KEY ("juntaId") REFERENCES public."Junta"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CapitalMovement CapitalMovement_multaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."CapitalMovement"
    ADD CONSTRAINT "CapitalMovement_multaId_fkey" FOREIGN KEY ("multaId") REFERENCES public."Multa"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CapitalMovement CapitalMovement_pagoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."CapitalMovement"
    ADD CONSTRAINT "CapitalMovement_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES public."PagoPrestamoNew"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CapitalMovement CapitalMovement_prestamoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."CapitalMovement"
    ADD CONSTRAINT "CapitalMovement_prestamoId_fkey" FOREIGN KEY ("prestamoId") REFERENCES public."PrestamoNew"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CapitalSocial CapitalSocial_juntaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."CapitalSocial"
    ADD CONSTRAINT "CapitalSocial_juntaId_fkey" FOREIGN KEY ("juntaId") REFERENCES public."Junta"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DailyAttendance DailyAttendance_agendaItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."DailyAttendance"
    ADD CONSTRAINT "DailyAttendance_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES public."AgendaItem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DailyAttendance DailyAttendance_dayScheduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."DailyAttendance"
    ADD CONSTRAINT "DailyAttendance_dayScheduleId_fkey" FOREIGN KEY ("dayScheduleId") REFERENCES public."DaySchedule"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DailyAttendance DailyAttendance_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."DailyAttendance"
    ADD CONSTRAINT "DailyAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DaySchedule DaySchedule_agendaItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."DaySchedule"
    ADD CONSTRAINT "DaySchedule_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES public."AgendaItem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GastoCapital GastoCapital_capitalSocialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."GastoCapital"
    ADD CONSTRAINT "GastoCapital_capitalSocialId_fkey" FOREIGN KEY ("capitalSocialId") REFERENCES public."CapitalSocial"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: IngresoCapital IngresoCapital_capitalSocialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."IngresoCapital"
    ADD CONSTRAINT "IngresoCapital_capitalSocialId_fkey" FOREIGN KEY ("capitalSocialId") REFERENCES public."CapitalSocial"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: JuntaMember JuntaMember_juntaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."JuntaMember"
    ADD CONSTRAINT "JuntaMember_juntaId_fkey" FOREIGN KEY ("juntaId") REFERENCES public."Junta"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: JuntaMember JuntaMember_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."JuntaMember"
    ADD CONSTRAINT "JuntaMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Junta Junta_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."Junta"
    ADD CONSTRAINT "Junta_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Multa Multa_agendaItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."Multa"
    ADD CONSTRAINT "Multa_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES public."AgendaItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Multa Multa_juntaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."Multa"
    ADD CONSTRAINT "Multa_juntaId_fkey" FOREIGN KEY ("juntaId") REFERENCES public."Junta"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Multa Multa_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."Multa"
    ADD CONSTRAINT "Multa_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PagoPrestamoNew PagoPrestamoNew_agendaItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."PagoPrestamoNew"
    ADD CONSTRAINT "PagoPrestamoNew_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES public."AgendaItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PagoPrestamoNew PagoPrestamoNew_prestamoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."PagoPrestamoNew"
    ADD CONSTRAINT "PagoPrestamoNew_prestamoId_fkey" FOREIGN KEY ("prestamoId") REFERENCES public."PrestamoNew"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PagoPrestamo PagoPrestamo_prestamoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."PagoPrestamo"
    ADD CONSTRAINT "PagoPrestamo_prestamoId_fkey" FOREIGN KEY ("prestamoId") REFERENCES public."Prestamo"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PaymentSchedule PaymentSchedule_prestamoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."PaymentSchedule"
    ADD CONSTRAINT "PaymentSchedule_prestamoId_fkey" FOREIGN KEY ("prestamoId") REFERENCES public."PrestamoNew"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PrestamoNew PrestamoNew_agendaItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."PrestamoNew"
    ADD CONSTRAINT "PrestamoNew_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES public."AgendaItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PrestamoNew PrestamoNew_avalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."PrestamoNew"
    ADD CONSTRAINT "PrestamoNew_avalId_fkey" FOREIGN KEY ("avalId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PrestamoNew PrestamoNew_juntaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."PrestamoNew"
    ADD CONSTRAINT "PrestamoNew_juntaId_fkey" FOREIGN KEY ("juntaId") REFERENCES public."Junta"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PrestamoNew PrestamoNew_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."PrestamoNew"
    ADD CONSTRAINT "PrestamoNew_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Prestamo Prestamo_juntaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."Prestamo"
    ADD CONSTRAINT "Prestamo_juntaId_fkey" FOREIGN KEY ("juntaId") REFERENCES public."Junta"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Prestamo Prestamo_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."Prestamo"
    ADD CONSTRAINT "Prestamo_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _UserAgendaItems _UserAgendaItems_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."_UserAgendaItems"
    ADD CONSTRAINT "_UserAgendaItems_A_fkey" FOREIGN KEY ("A") REFERENCES public."AgendaItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _UserAgendaItems _UserAgendaItems_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: donaldcross
--

ALTER TABLE ONLY public."_UserAgendaItems"
    ADD CONSTRAINT "_UserAgendaItems_B_fkey" FOREIGN KEY ("B") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

