


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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."advance_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "text" NOT NULL,
    "amount" numeric NOT NULL,
    "given_on" "date" NOT NULL,
    "deduct_month" "text" NOT NULL,
    "reason" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."advance_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_config" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance" (
    "id" bigint NOT NULL,
    "employee_id" "text" NOT NULL,
    "date" "date" NOT NULL,
    "check_in" "text",
    "check_out" "text",
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "attendance_status_check" CHECK (("status" = ANY (ARRAY['present'::"text", 'late'::"text", 'absent'::"text", 'wfh'::"text"])))
);


ALTER TABLE "public"."attendance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance_audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "text" NOT NULL,
    "employee_name" "text" NOT NULL,
    "attendance_date" "date" NOT NULL,
    "previous_status" "text",
    "new_status" "text" NOT NULL,
    "check_in_before" "text",
    "check_out_before" "text",
    "check_in_after" "text",
    "check_out_after" "text",
    "edited_by" "text" NOT NULL,
    "edit_timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reason" "text"
);


ALTER TABLE "public"."attendance_audit_logs" OWNER TO "postgres";


ALTER TABLE "public"."attendance" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."attendance_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."commissions" (
    "id" "text" NOT NULL,
    "lead_id" "text" NOT NULL,
    "lead_name" "text" NOT NULL,
    "position" "text" NOT NULL,
    "amount" numeric NOT NULL,
    "performance" "text" NOT NULL,
    "month" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "commissions_status_check" CHECK (("status" = ANY (ARRAY['paid'::"text", 'pending'::"text", 'approved'::"text"])))
);


ALTER TABLE "public"."commissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_pins" (
    "employee_id" "text" NOT NULL,
    "pin" "text" DEFAULT '1234'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."employee_pins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "dept" "text" NOT NULL,
    "role" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "location" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "joined" "text" NOT NULL,
    "salary" "text" NOT NULL,
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "bank_name" "text",
    "bank_account_no" "text",
    "ifsc_code" "text",
    "pan_no" "text",
    "pf_no" "text"
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."incentives" (
    "id" "text" NOT NULL,
    "employee_id" "text" NOT NULL,
    "employee_name" "text" NOT NULL,
    "dept" "text" NOT NULL,
    "rule_type" "text" NOT NULL,
    "amount" numeric NOT NULL,
    "target" numeric NOT NULL,
    "month" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "incentives_status_check" CHECK (("status" = ANY (ARRAY['paid'::"text", 'pending'::"text", 'approved'::"text"])))
);


ALTER TABLE "public"."incentives" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leaves" (
    "id" "text" NOT NULL,
    "employee_id" "text" NOT NULL,
    "employee_name" "text" NOT NULL,
    "from_date" "date" NOT NULL,
    "to_date" "date" NOT NULL,
    "reason" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "applied_on" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "leaves_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."leaves" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll_month_locks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "year" integer NOT NULL,
    "month" integer NOT NULL,
    "locked_by" "text" DEFAULT 'Admin'::"text" NOT NULL,
    "locked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    CONSTRAINT "payroll_month_locks_month_check" CHECK ((("month" >= 1) AND ("month" <= 12)))
);


ALTER TABLE "public"."payroll_month_locks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payslips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slip_id" "text" NOT NULL,
    "employee_id" "text" NOT NULL,
    "employee_name" "text" NOT NULL,
    "department" "text" NOT NULL,
    "role" "text" NOT NULL,
    "month" "text" NOT NULL,
    "month_label" "text" NOT NULL,
    "basic_salary" numeric DEFAULT 0 NOT NULL,
    "hra" numeric DEFAULT 0 NOT NULL,
    "allowances" numeric DEFAULT 0 NOT NULL,
    "gross_salary" numeric DEFAULT 0 NOT NULL,
    "incentives" numeric DEFAULT 0 NOT NULL,
    "pf_deduction" numeric DEFAULT 0 NOT NULL,
    "esi_deduction" numeric DEFAULT 0 NOT NULL,
    "tds_deduction" numeric DEFAULT 0 NOT NULL,
    "pt_deduction" numeric DEFAULT 0 NOT NULL,
    "lop_deduction" numeric DEFAULT 0 NOT NULL,
    "advance_deduction" numeric DEFAULT 0 NOT NULL,
    "total_deductions" numeric DEFAULT 0 NOT NULL,
    "net_pay" numeric DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'processed'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payslips" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales" (
    "id" "text" NOT NULL,
    "employee_id" "text" NOT NULL,
    "date" "date" NOT NULL,
    "product" "text" NOT NULL,
    "amount" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sales" OWNER TO "postgres";


ALTER TABLE ONLY "public"."advance_payments"
    ADD CONSTRAINT "advance_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_config"
    ADD CONSTRAINT "app_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."attendance_audit_logs"
    ADD CONSTRAINT "attendance_audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commissions"
    ADD CONSTRAINT "commissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_pins"
    ADD CONSTRAINT "employee_pins_pkey" PRIMARY KEY ("employee_id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."incentives"
    ADD CONSTRAINT "incentives_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leaves"
    ADD CONSTRAINT "leaves_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll_month_locks"
    ADD CONSTRAINT "payroll_month_locks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll_month_locks"
    ADD CONSTRAINT "payroll_month_locks_year_month_key" UNIQUE ("year", "month");



ALTER TABLE ONLY "public"."payslips"
    ADD CONSTRAINT "payslips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payslips"
    ADD CONSTRAINT "payslips_slip_id_key" UNIQUE ("slip_id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "unique_employee_date" UNIQUE ("employee_id", "date");



CREATE INDEX "idx_audit_date" ON "public"."attendance_audit_logs" USING "btree" ("attendance_date" DESC);



CREATE INDEX "idx_audit_employee_id" ON "public"."attendance_audit_logs" USING "btree" ("employee_id");



CREATE INDEX "idx_audit_timestamp" ON "public"."attendance_audit_logs" USING "btree" ("edit_timestamp" DESC);



CREATE INDEX "idx_lock_year_month" ON "public"."payroll_month_locks" USING "btree" ("year", "month");



CREATE INDEX "idx_payslips_employee_id" ON "public"."payslips" USING "btree" ("employee_id");



CREATE INDEX "idx_payslips_month" ON "public"."payslips" USING "btree" ("month");



CREATE INDEX "idx_payslips_slip_id" ON "public"."payslips" USING "btree" ("slip_id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_pins"
    ADD CONSTRAINT "employee_pins_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incentives"
    ADD CONSTRAINT "incentives_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leaves"
    ADD CONSTRAINT "leaves_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE "public"."advance_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendance_audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."commissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_pins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."incentives" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leaves" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payroll_month_locks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payslips" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."advance_payments" TO "anon";
GRANT ALL ON TABLE "public"."advance_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."advance_payments" TO "service_role";



GRANT ALL ON TABLE "public"."app_config" TO "anon";
GRANT ALL ON TABLE "public"."app_config" TO "authenticated";
GRANT ALL ON TABLE "public"."app_config" TO "service_role";



GRANT ALL ON TABLE "public"."attendance" TO "anon";
GRANT ALL ON TABLE "public"."attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."attendance_audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_audit_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."attendance_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."attendance_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."attendance_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."commissions" TO "anon";
GRANT ALL ON TABLE "public"."commissions" TO "authenticated";
GRANT ALL ON TABLE "public"."commissions" TO "service_role";



GRANT ALL ON TABLE "public"."employee_pins" TO "anon";
GRANT ALL ON TABLE "public"."employee_pins" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_pins" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."incentives" TO "anon";
GRANT ALL ON TABLE "public"."incentives" TO "authenticated";
GRANT ALL ON TABLE "public"."incentives" TO "service_role";



GRANT ALL ON TABLE "public"."leaves" TO "anon";
GRANT ALL ON TABLE "public"."leaves" TO "authenticated";
GRANT ALL ON TABLE "public"."leaves" TO "service_role";



GRANT ALL ON TABLE "public"."payroll_month_locks" TO "anon";
GRANT ALL ON TABLE "public"."payroll_month_locks" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll_month_locks" TO "service_role";



GRANT ALL ON TABLE "public"."payslips" TO "anon";
GRANT ALL ON TABLE "public"."payslips" TO "authenticated";
GRANT ALL ON TABLE "public"."payslips" TO "service_role";



GRANT ALL ON TABLE "public"."sales" TO "anon";
GRANT ALL ON TABLE "public"."sales" TO "authenticated";
GRANT ALL ON TABLE "public"."sales" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







