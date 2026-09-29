--
-- PostgreSQL database dump
--

\restrict vyVtg14arrFfukwScPjZvPnFodhR0tYQMoe3lNOg1gECqyTKWy3M5qhgbSlpwa9

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

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
-- Name: concerne; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.concerne (
    id_jour character varying(50) NOT NULL,
    num_ref character varying(50) NOT NULL
);


ALTER TABLE public.concerne OWNER TO postgres;

--
-- Name: dag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dag (
    im character varying(50) NOT NULL
);


ALTER TABLE public.dag OWNER TO postgres;

--
-- Name: dag_rh; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dag_rh (
    im character varying(50) NOT NULL
);


ALTER TABLE public.dag_rh OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    num_ref character varying(50) NOT NULL,
    date_num date NOT NULL,
    format character varying(20),
    cat character varying(50),
    annee_redac character varying(4),
    im_dag_rh character varying(50),
    title character varying(255) DEFAULT 'Document'::character varying NOT NULL,
    file_path character varying(500) DEFAULT ''::character varying NOT NULL,
    est_sup boolean DEFAULT false NOT NULL
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: journal; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.journal (
    id_jour character varying(50) NOT NULL,
    date_action date NOT NULL,
    "desc" text,
    im_user character varying(50) NOT NULL,
    num_ref_doc character varying(100)
);


ALTER TABLE public.journal OWNER TO postgres;

--
-- Name: rh; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rh (
    im character varying(50) NOT NULL
);


ALTER TABLE public.rh OWNER TO postgres;

--
-- Name: rsi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rsi (
    im character varying(50) NOT NULL
);


ALTER TABLE public.rsi OWNER TO postgres;

--
-- Name: utilisateur; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utilisateur (
    im character varying(50) NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100),
    mdp character varying(255) NOT NULL,
    type_user character varying(20)
);


ALTER TABLE public.utilisateur OWNER TO postgres;

--
-- Data for Name: concerne; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.concerne (id_jour, num_ref) FROM stdin;
\.


--
-- Data for Name: dag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dag (im) FROM stdin;
\.


--
-- Data for Name: dag_rh; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dag_rh (im) FROM stdin;
DAG001
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (num_ref, date_num, format, cat, annee_redac, im_dag_rh, title, file_path, est_sup) FROM stdin;
45	2026-09-24	pdf	Nomination	2026	DAG001	yfyfyug	./uploaded_documents/45_TD 1-sur-les-diagrammes-comportementaux.pdf	f
254	2026-09-27	pdf	Autre	2018	RH001	autre	./uploaded_documents/254_Lettre_de_motivation_Rahariala_Nomenjanahary.pdf	f
20757	2026-09-22	pdf	Finance	2026	DAG001	yhd	./uploaded_documents/20757_technologies_python.pdf	f
2025-02-rt	2026-09-22	pdf	Nomination	2026	DAG001	ytytyt	./uploaded_documents/2025-02-rt_TD 1-sur-les-diagrammes-comportementaux.pdf	t
\.


--
-- Data for Name: journal; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.journal (id_jour, date_action, "desc", im_user, num_ref_doc) FROM stdin;
590b3de6-6a0c-4821-b67c-b2097c8ca2ab	2026-09-22	Ajout du document 785 par l'agent DAG001	DAG001	\N
18d3c0ff-8649-42e6-8b6f-b6c18849554b	2026-09-22	Suppression du document 785	DAG001	\N
b62aeece-9fe4-45b7-89fd-45946e853583	2026-09-21	Ajout du document 74 par l'agent DAG001	DAG001	\N
4787d95d-e1a0-4da6-8028-3b8bcb156732	2026-09-22	Suppression du document 74	DAG001	\N
dac7fcc8-2323-4674-bfaf-e153af581f30	2026-09-21	Ajout du document string1 par l'agent DAG001	DAG001	\N
ba491531-1c6e-40ad-ac8d-5d7b96290f6e	2026-09-22	Suppression du document string1	DAG001	\N
5d9d256f-4783-4382-abab-4034725a1167	2026-09-17	Ajout du document 21 par l'agent DAG001	DAG001	\N
b3360945-558d-489c-af2b-0e251293643a	2026-09-22	Suppression du document 21	DAG001	\N
ac20b83d-d3a8-46eb-b880-3a002c7e9f11	2026-09-22	Ajout du document 20757 par l'agent DAG001	DAG001	20757
72c58f2f-dd71-42fc-92a9-dfdee4c997cf	2026-09-22	Ajout du document 2025-02-rt par l'agent DAG001	DAG001	2025-02-rt
486b19c6-739d-4993-bd74-b0cf7072269d	2026-09-24	Ajout du document 45 par l'agent DAG001	DAG001	45
6fb9b14e-b69d-49e2-9173-bbe1b2aa81f4	2026-09-27	Ajout du document 254 par l'agent RH001	RH001	254
9d47a887	2026-09-27	Document mis en corbeille: 254	RH001	254
123d406d	2026-09-27	Restauration du document: 254	RH001	254
b0da1216	2026-09-27	Document mis en corbeille: 20757	RH001	20757
44b8e419	2026-09-27	Restauration du document: 20757	RH001	20757
247602df	2026-09-27	Ajout du document 8844 par l'agent RH001	RH001	\N
8723c034	2026-09-27	Document mis en corbeille: 8844	RH001	\N
124860e5	2026-09-27	Suppression définitive du document 8844	RH001	\N
83736221	2026-09-28	Document mis en corbeille: 2025-02-rt	RH001	2025-02-rt
\.


--
-- Data for Name: rh; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rh (im) FROM stdin;
\.


--
-- Data for Name: rsi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rsi (im) FROM stdin;
\.


--
-- Data for Name: utilisateur; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utilisateur (im, nom, prenom, mdp, type_user) FROM stdin;
DAG001	RABEMANANJARA	Jean	mot_de_passe_hache_ici	dag_rh
RH001	BARY85	Bary	mot de passe	RH
\.


--
-- Name: concerne concerne_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.concerne
    ADD CONSTRAINT concerne_pkey PRIMARY KEY (id_jour, num_ref);


--
-- Name: dag dag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dag
    ADD CONSTRAINT dag_pkey PRIMARY KEY (im);


--
-- Name: dag_rh dag_rh_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dag_rh
    ADD CONSTRAINT dag_rh_pkey PRIMARY KEY (im);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (num_ref);


--
-- Name: journal journal_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.journal
    ADD CONSTRAINT journal_pkey PRIMARY KEY (id_jour);


--
-- Name: rh rh_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rh
    ADD CONSTRAINT rh_pkey PRIMARY KEY (im);


--
-- Name: rsi rsi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rsi
    ADD CONSTRAINT rsi_pkey PRIMARY KEY (im);


--
-- Name: utilisateur utilisateur_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_pkey PRIMARY KEY (im);


--
-- Name: dag dag_im_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dag
    ADD CONSTRAINT dag_im_fkey FOREIGN KEY (im) REFERENCES public.utilisateur(im);


--
-- Name: concerne fk_concerne_document; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.concerne
    ADD CONSTRAINT fk_concerne_document FOREIGN KEY (num_ref) REFERENCES public.documents(num_ref) ON DELETE CASCADE;


--
-- Name: concerne fk_concerne_journal; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.concerne
    ADD CONSTRAINT fk_concerne_journal FOREIGN KEY (id_jour) REFERENCES public.journal(id_jour) ON DELETE CASCADE;


--
-- Name: dag_rh fk_dag_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dag_rh
    ADD CONSTRAINT fk_dag_utilisateur FOREIGN KEY (im) REFERENCES public.utilisateur(im) ON DELETE CASCADE;


--
-- Name: documents fk_documents_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT fk_documents_utilisateur FOREIGN KEY (im_dag_rh) REFERENCES public.utilisateur(im) ON DELETE SET NULL;


--
-- Name: journal fk_journal_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.journal
    ADD CONSTRAINT fk_journal_user FOREIGN KEY (im_user) REFERENCES public.utilisateur(im) ON DELETE CASCADE;


--
-- Name: rsi fk_rsi_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rsi
    ADD CONSTRAINT fk_rsi_utilisateur FOREIGN KEY (im) REFERENCES public.utilisateur(im) ON DELETE CASCADE;


--
-- Name: journal journal_num_ref_doc_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.journal
    ADD CONSTRAINT journal_num_ref_doc_fkey FOREIGN KEY (num_ref_doc) REFERENCES public.documents(num_ref) ON DELETE CASCADE;


--
-- Name: rh rh_im_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rh
    ADD CONSTRAINT rh_im_fkey FOREIGN KEY (im) REFERENCES public.utilisateur(im);


--
-- PostgreSQL database dump complete
--

\unrestrict vyVtg14arrFfukwScPjZvPnFodhR0tYQMoe3lNOg1gECqyTKWy3M5qhgbSlpwa9

