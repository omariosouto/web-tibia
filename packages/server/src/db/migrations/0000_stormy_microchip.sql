CREATE TABLE IF NOT EXISTS "maps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"layers" integer DEFAULT 1 NOT NULL,
	"data" jsonb NOT NULL,
	"spawn_x" integer DEFAULT 50 NOT NULL,
	"spawn_y" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "maps_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monster_spawns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"map_id" uuid NOT NULL,
	"monster_type_id" integer NOT NULL,
	"spawn_x" integer NOT NULL,
	"spawn_y" integer NOT NULL,
	"radius" integer DEFAULT 3 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monster_types" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"health" integer NOT NULL,
	"damage" integer NOT NULL,
	"sprite_id" integer NOT NULL,
	"respawn_time" integer DEFAULT 30 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"position_x" integer DEFAULT 100 NOT NULL,
	"position_y" integer DEFAULT 100 NOT NULL,
	"position_z" integer DEFAULT 0 NOT NULL,
	"sprite_id" integer DEFAULT 0 NOT NULL,
	"direction" text DEFAULT 'south' NOT NULL,
	"health" integer DEFAULT 100 NOT NULL,
	"max_health" integer DEFAULT 100 NOT NULL,
	"is_online" boolean DEFAULT false NOT NULL,
	"last_seen" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "players_name_unique" UNIQUE("name")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monster_spawns" ADD CONSTRAINT "monster_spawns_map_id_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."maps"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monster_spawns" ADD CONSTRAINT "monster_spawns_monster_type_id_monster_types_id_fk" FOREIGN KEY ("monster_type_id") REFERENCES "public"."monster_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
