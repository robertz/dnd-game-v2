-- gameserver schema — generated from the live database via:
--   mysqldump --no-data --set-gtid-purged=OFF --skip-comments gameserver
-- Run against an existing database (no USE/CREATE DATABASE statement here
-- on purpose — always specify the target explicitly on the command line):
--   mysql -u root gameserver < db/schema.sql
-- See db/README.md.


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `adventure_map_chunks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `adventure_map_chunks` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `map_id` int unsigned NOT NULL,
  `chunk_x` int unsigned NOT NULL,
  `chunk_y` int unsigned NOT NULL,
  `row_data` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_map_chunk` (`map_id`,`chunk_x`,`chunk_y`),
  CONSTRAINT `fk_chunks_map` FOREIGN KEY (`map_id`) REFERENCES `adventure_maps` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=135 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `adventure_map_pois`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `adventure_map_pois` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `map_id` int unsigned NOT NULL,
  `x` int unsigned NOT NULL,
  `y` int unsigned NOT NULL,
  `poi_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pois_map_xy` (`map_id`,`x`,`y`),
  CONSTRAINT `fk_pois_map` FOREIGN KEY (`map_id`) REFERENCES `adventure_maps` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=426 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `adventure_maps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `adventure_maps` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `module_id` int unsigned NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `width` int unsigned NOT NULL,
  `height` int unsigned NOT NULL,
  `chunk_size` int unsigned NOT NULL DEFAULT '32',
  `tile_legend` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `player_spawn_x` int unsigned NOT NULL,
  `player_spawn_y` int unsigned NOT NULL,
  `opponent_spawn_x` int unsigned NOT NULL,
  `opponent_spawn_y` int unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_entry` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_module_map` (`module_id`,`slug`),
  CONSTRAINT `fk_maps_module` FOREIGN KEY (`module_id`) REFERENCES `adventure_modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `adventure_modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `adventure_modules` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `owner_user_id` int unsigned DEFAULT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `version` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1.0.0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_adventure_modules_slug` (`slug`),
  KEY `idx_modules_owner` (`owner_user_id`),
  CONSTRAINT `fk_modules_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `armors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `armors` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `armor_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `base_ac` tinyint unsigned NOT NULL,
  `max_dex_bonus` tinyint DEFAULT NULL,
  `strength_requirement` tinyint unsigned DEFAULT NULL,
  `stealth_disadvantage` tinyint(1) NOT NULL DEFAULT '0',
  `weight` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cost` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_armors_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `backgrounds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backgrounds` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `skill_proficiencies` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tool_proficiencies` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bonus_language_count` tinyint unsigned NOT NULL DEFAULT '0',
  `equipment_text` text COLLATE utf8mb4_unicode_ci,
  `feature_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `feature_description` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_backgrounds_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `character_armor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `character_armor` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `character_id` int unsigned NOT NULL,
  `armor_id` int unsigned NOT NULL,
  `equipped` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_character_armor` (`character_id`,`armor_id`),
  KEY `fk_character_armor_armor` (`armor_id`),
  CONSTRAINT `fk_character_armor_armor` FOREIGN KEY (`armor_id`) REFERENCES `armors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_armor_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `character_feats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `character_feats` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `character_id` int unsigned NOT NULL,
  `feat_id` int unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_character_feat` (`character_id`,`feat_id`),
  KEY `fk_character_feats_feat` (`feat_id`),
  CONSTRAINT `fk_character_feats_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_feats_feat` FOREIGN KEY (`feat_id`) REFERENCES `feats` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `character_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `character_features` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `character_id` int unsigned NOT NULL,
  `class_feature_id` int unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_character_feature` (`character_id`,`class_feature_id`),
  KEY `fk_character_features_feature` (`class_feature_id`),
  CONSTRAINT `fk_character_features_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_features_feature` FOREIGN KEY (`class_feature_id`) REFERENCES `class_features` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=248 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `character_inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `character_inventory` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `character_id` int unsigned NOT NULL,
  `weapon_id` int unsigned NOT NULL,
  `category` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `equipped` tinyint(1) NOT NULL DEFAULT '0',
  `quantity` smallint unsigned NOT NULL DEFAULT '1',
  `attack_bonus` tinyint DEFAULT NULL,
  `damage_bonus` tinyint DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_character_weapon` (`character_id`,`weapon_id`),
  KEY `fk_character_inventory_weapon` (`weapon_id`),
  CONSTRAINT `fk_character_inventory_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_inventory_weapon` FOREIGN KEY (`weapon_id`) REFERENCES `weapons` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=169 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `character_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `character_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `character_id` int unsigned NOT NULL,
  `item_id` int unsigned NOT NULL,
  `quantity` smallint unsigned NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_character_item` (`character_id`,`item_id`),
  KEY `fk_character_items_item` (`item_id`),
  CONSTRAINT `fk_character_items_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_items_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `character_multiclass_levels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `character_multiclass_levels` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `character_id` int unsigned NOT NULL,
  `class_id` int unsigned NOT NULL,
  `subclass_id` int unsigned DEFAULT NULL,
  `level` tinyint unsigned NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_character_multiclass_levels` (`character_id`,`class_id`),
  KEY `fk_multiclass_levels_class` (`class_id`),
  KEY `fk_multiclass_levels_subclass` (`subclass_id`),
  CONSTRAINT `fk_multiclass_levels_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_multiclass_levels_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_multiclass_levels_subclass` FOREIGN KEY (`subclass_id`) REFERENCES `subclasses` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `characters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `characters` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `owner_user_id` int unsigned DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `class_id` int unsigned NOT NULL,
  `subclass_id` int unsigned DEFAULT NULL,
  `species` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `background` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alignment` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `level` tinyint unsigned NOT NULL DEFAULT '1',
  `str` tinyint unsigned NOT NULL,
  `dex` tinyint unsigned NOT NULL,
  `con` tinyint unsigned NOT NULL,
  `int_score` tinyint unsigned NOT NULL,
  `wis` tinyint unsigned NOT NULL,
  `cha` tinyint unsigned NOT NULL,
  `proficiency_bonus` tinyint unsigned NOT NULL,
  `armor_class` tinyint unsigned NOT NULL,
  `hit_points` smallint NOT NULL,
  `max_hit_points` smallint unsigned NOT NULL,
  `speed` smallint unsigned NOT NULL DEFAULT '30',
  `experience_points` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `hit_dice_spent` tinyint unsigned NOT NULL DEFAULT '0',
  `spent_spell_slots` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '{}',
  `gold` int unsigned NOT NULL DEFAULT '0',
  `chosen_skill_proficiencies` text COLLATE utf8mb4_unicode_ci,
  `known_cantrips` text COLLATE utf8mb4_unicode_ci,
  `known_spells` text COLLATE utf8mb4_unicode_ci,
  `expertise_skills` text COLLATE utf8mb4_unicode_ci,
  `game_clock_seconds` bigint unsigned NOT NULL DEFAULT '0',
  `last_long_rest_seconds` bigint unsigned DEFAULT NULL,
  `rages_used` int unsigned NOT NULL DEFAULT '0',
  `used_second_wind` tinyint(1) NOT NULL DEFAULT '0',
  `used_breath_weapon` tinyint(1) NOT NULL DEFAULT '0',
  `used_relentless_endurance` tinyint(1) NOT NULL DEFAULT '0',
  `used_heroic_inspiration` tinyint(1) NOT NULL DEFAULT '0',
  `used_magic_initiate_spell` tinyint(1) NOT NULL DEFAULT '0',
  `next_level_class_id` int unsigned DEFAULT NULL,
  `pending_magic_initiate_cantrips` int NOT NULL DEFAULT '0',
  `pending_magic_initiate_spell` tinyint(1) NOT NULL DEFAULT '0',
  `pending_fighting_style_cantrips` int NOT NULL DEFAULT '0',
  `fighting_style_cantrip_class` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `monsters_fought` int unsigned NOT NULL DEFAULT '0',
  `monsters_killed` int unsigned NOT NULL DEFAULT '0',
  `deaths` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_characters_subclass` (`subclass_id`),
  KEY `idx_characters_class` (`class_id`),
  KEY `fk_characters_next_level_class` (`next_level_class_id`),
  KEY `idx_characters_owner` (`owner_user_id`),
  CONSTRAINT `fk_characters_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `fk_characters_next_level_class` FOREIGN KEY (`next_level_class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_characters_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_characters_subclass` FOREIGN KEY (`subclass_id`) REFERENCES `subclasses` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=250 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `class_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_features` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `class_id` int unsigned NOT NULL,
  `subclass_id` int unsigned DEFAULT NULL,
  `level` tinyint unsigned NOT NULL,
  `sort_order` int unsigned NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_features_subclass` (`subclass_id`),
  KEY `idx_features_class_level` (`class_id`,`level`),
  CONSTRAINT `fk_features_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_features_subclass` FOREIGN KEY (`subclass_id`) REFERENCES `subclasses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=233 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `primary_ability` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hit_die` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `saving_throw_proficiencies` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `skill_proficiencies` text COLLATE utf8mb4_unicode_ci,
  `weapon_proficiencies` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tool_proficiencies` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `armor_training` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `starting_equipment` text COLLATE utf8mb4_unicode_ci,
  `becoming_text` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_classes_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `conditions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conditions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_conditions_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `feats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feats` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prerequisite` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `repeatable` tinyint(1) NOT NULL DEFAULT '0',
  `repeatable_text` text COLLATE utf8mb4_unicode_ci,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_feats_name` (`name`),
  KEY `idx_feats_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `weight` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cost` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_items_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `magic_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `magic_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_detail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rarity` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requires_attunement` tinyint(1) NOT NULL DEFAULT '0',
  `attunement_requirement` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_magic_items_name` (`name`),
  KEY `idx_magic_items_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=259 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `monsters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `monsters` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `group_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creature_type` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alignment` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `armor_class` tinyint unsigned DEFAULT NULL,
  `initiative_modifier` tinyint DEFAULT NULL,
  `initiative_score` tinyint DEFAULT NULL,
  `hit_points` smallint unsigned DEFAULT NULL,
  `hit_dice` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `speed` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `str` tinyint DEFAULT NULL,
  `dex` tinyint DEFAULT NULL,
  `con` tinyint DEFAULT NULL,
  `int_score` tinyint DEFAULT NULL,
  `wis` tinyint DEFAULT NULL,
  `cha` tinyint DEFAULT NULL,
  `str_save` tinyint DEFAULT NULL,
  `dex_save` tinyint DEFAULT NULL,
  `con_save` tinyint DEFAULT NULL,
  `int_save` tinyint DEFAULT NULL,
  `wis_save` tinyint DEFAULT NULL,
  `cha_save` tinyint DEFAULT NULL,
  `skills` text COLLATE utf8mb4_unicode_ci,
  `resistances` text COLLATE utf8mb4_unicode_ci,
  `immunities` text COLLATE utf8mb4_unicode_ci,
  `vulnerabilities` text COLLATE utf8mb4_unicode_ci,
  `gear` text COLLATE utf8mb4_unicode_ci,
  `senses` text COLLATE utf8mb4_unicode_ci,
  `languages` text COLLATE utf8mb4_unicode_ci,
  `cr` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `xp` int unsigned DEFAULT NULL,
  `proficiency_bonus` tinyint DEFAULT NULL,
  `traits_text` longtext COLLATE utf8mb4_unicode_ci,
  `actions_text` longtext COLLATE utf8mb4_unicode_ci,
  `bonus_actions_text` longtext COLLATE utf8mb4_unicode_ci,
  `reactions_text` longtext COLLATE utf8mb4_unicode_ci,
  `legendary_actions_text` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `actions_json` text COLLATE utf8mb4_unicode_ci,
  `special_abilities_json` text COLLATE utf8mb4_unicode_ci,
  `legendary_actions_json` text COLLATE utf8mb4_unicode_ci,
  `reactions_json` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_monsters_name` (`name`),
  KEY `idx_monsters_group` (`group_name`),
  KEY `idx_monsters_cr` (`cr`)
) ENGINE=InnoDB AUTO_INCREMENT=361 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `species`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `species` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `parent_species_id` int unsigned DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `speed` smallint unsigned DEFAULT NULL,
  `darkvision` smallint unsigned DEFAULT NULL,
  `str_bonus` tinyint NOT NULL DEFAULT '0',
  `dex_bonus` tinyint NOT NULL DEFAULT '0',
  `con_bonus` tinyint NOT NULL DEFAULT '0',
  `int_bonus` tinyint NOT NULL DEFAULT '0',
  `wis_bonus` tinyint NOT NULL DEFAULT '0',
  `cha_bonus` tinyint NOT NULL DEFAULT '0',
  `choice_ability_count` tinyint unsigned NOT NULL DEFAULT '0',
  `choice_ability_bonus` tinyint unsigned NOT NULL DEFAULT '0',
  `languages` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bonus_language_choice` tinyint(1) NOT NULL DEFAULT '0',
  `resistances` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_species_name` (`name`),
  KEY `fk_species_parent` (`parent_species_id`),
  CONSTRAINT `fk_species_parent` FOREIGN KEY (`parent_species_id`) REFERENCES `species` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `species_traits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `species_traits` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `species_id` int unsigned NOT NULL,
  `sort_order` int unsigned NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_species_traits_species` (`species_id`),
  CONSTRAINT `fk_species_traits_species` FOREIGN KEY (`species_id`) REFERENCES `species` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `spells`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spells` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `level` tinyint unsigned NOT NULL,
  `school` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `classes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `casting_time` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `range` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `components` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `higher_level_text` text COLLATE utf8mb4_unicode_ci,
  `effect_type` enum('attack','save','heal','utility') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'utility',
  `attack_type` enum('melee','ranged') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `save_ability` enum('str','dex','con','int','wis','cha') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `save_effect` enum('half','none') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `damage_dice` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `damage_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `heal_dice` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_spells_name` (`name`),
  KEY `idx_spells_level` (`level`),
  KEY `idx_spells_school` (`school`),
  KEY `idx_spells_effect_type` (`effect_type`)
) ENGINE=InnoDB AUTO_INCREMENT=340 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `subclasses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subclasses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `class_id` int unsigned NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tagline` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_class_subclass` (`class_id`,`name`),
  CONSTRAINT `fk_subclasses_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `weapons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `weapons` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `weapon_type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `damage` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `damage_dice` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `damage_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `properties` text COLLATE utf8mb4_unicode_ci,
  `mastery` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `weight` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cost` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_weapons_name` (`name`),
  KEY `idx_weapons_category` (`category`,`weapon_type`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

