import pgPromise from "pg-promise";
import * as dotenv from "dotenv";

const createScript = `
--
-- PostgreSQL database dump
--

-- Dumped from database version 13.6
-- Dumped by pg_dump version 13.6

-- Started on 2022-06-05 10:21:59

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'WIN1251';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

--
-- TOC entry 204 (class 1259 OID 48302)
-- Name: cities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cities (
    id bigint NOT NULL,
    name text NOT NULL,
    data integer NOT NULL
);


ALTER TABLE public.cities OWNER TO postgres;

--
-- TOC entry 203 (class 1259 OID 48300)
-- Name: cities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cities_id_seq OWNER TO postgres;

--
-- TOC entry 3017 (class 0 OID 0)
-- Dependencies: 203
-- Name: cities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cities_id_seq OWNED BY public.cities.id;


--
-- TOC entry 202 (class 1259 OID 48290)
-- Name: citizens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.citizens (
    id bigint NOT NULL,
    name text NOT NULL,
    "cityId" bigint NOT NULL
);


ALTER TABLE public.citizens OWNER TO postgres;

--
-- TOC entry 207 (class 1259 OID 48315)
-- Name: citizensGroups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."citizensGroups" (
    id bigint NOT NULL,
    "citizenId" bigint NOT NULL,
    type text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public."citizensGroups" OWNER TO postgres;

--
-- TOC entry 206 (class 1259 OID 48313)
-- Name: citizensGroups_citizenId_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."citizensGroups_citizenId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."citizensGroups_citizenId_seq" OWNER TO postgres;

--
-- TOC entry 3018 (class 0 OID 0)
-- Dependencies: 206
-- Name: citizensGroups_citizenId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."citizensGroups_citizenId_seq" OWNED BY public."citizensGroups"."citizenId";


--
-- TOC entry 205 (class 1259 OID 48311)
-- Name: citizensGroups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."citizensGroups_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."citizensGroups_id_seq" OWNER TO postgres;

--
-- TOC entry 3019 (class 0 OID 0)
-- Dependencies: 205
-- Name: citizensGroups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."citizensGroups_id_seq" OWNED BY public."citizensGroups".id;


--
-- TOC entry 201 (class 1259 OID 48288)
-- Name: citizens_cityId_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."citizens_cityId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."citizens_cityId_seq" OWNER TO postgres;

--
-- TOC entry 3020 (class 0 OID 0)
-- Dependencies: 201
-- Name: citizens_cityId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."citizens_cityId_seq" OWNED BY public.citizens."cityId";


--
-- TOC entry 200 (class 1259 OID 48286)
-- Name: citizens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.citizens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.citizens_id_seq OWNER TO postgres;

--
-- TOC entry 3021 (class 0 OID 0)
-- Dependencies: 200
-- Name: citizens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.citizens_id_seq OWNED BY public.citizens.id;


--
-- TOC entry 2871 (class 2604 OID 48305)
-- Name: cities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cities ALTER COLUMN id SET DEFAULT nextval('public.cities_id_seq'::regclass);


--
-- TOC entry 2869 (class 2604 OID 48293)
-- Name: citizens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citizens ALTER COLUMN id SET DEFAULT nextval('public.citizens_id_seq'::regclass);


--
-- TOC entry 2870 (class 2604 OID 48294)
-- Name: citizens cityId; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citizens ALTER COLUMN "cityId" SET DEFAULT nextval('public."citizens_cityId_seq"'::regclass);


--
-- TOC entry 2872 (class 2604 OID 48318)
-- Name: citizensGroups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."citizensGroups" ALTER COLUMN id SET DEFAULT nextval('public."citizensGroups_id_seq"'::regclass);


--
-- TOC entry 2873 (class 2604 OID 48319)
-- Name: citizensGroups citizenId; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."citizensGroups" ALTER COLUMN "citizenId" SET DEFAULT nextval('public."citizensGroups_citizenId_seq"'::regclass);


--
-- TOC entry 2877 (class 2606 OID 48310)
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- TOC entry 2879 (class 2606 OID 48324)
-- Name: citizensGroups citizensGroups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."citizensGroups"
    ADD CONSTRAINT "citizensGroups_pkey" PRIMARY KEY (id);


--
-- TOC entry 2875 (class 2606 OID 48299)
-- Name: citizens citizens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citizens
    ADD CONSTRAINT citizens_pkey PRIMARY KEY (id);


--
-- TOC entry 2880 (class 2606 OID 48330)
-- Name: citizens citiesFK; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citizens
    ADD CONSTRAINT "citiesFK" FOREIGN KEY ("cityId") REFERENCES public.cities(id) ON DELETE CASCADE NOT VALID;


--
-- TOC entry 2881 (class 2606 OID 48325)
-- Name: citizensGroups citizensGroupsFK; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."citizensGroups"
    ADD CONSTRAINT "citizensGroupsFK" FOREIGN KEY ("citizenId") REFERENCES public.citizens(id) ON DELETE CASCADE NOT VALID;


-- Completed on 2022-06-05 10:21:59

--
-- PostgreSQL database dump complete
--
`

dotenv.config({path: '../.env'});

const pgp = pgPromise({});
let db = pgp(`postgres://postgres:${process.env.PG_PASSWORD}@localhost:5432/citizens`);

db.connect()
    .then(async () => {
        try {
            await db.any(createScript)
            console.log('database initialized')
            pgp.end()
        } catch (e) {
            console.log(e)
            pgp.end()
        }
    })
    .catch(err => {
        console.log(err);
    });
