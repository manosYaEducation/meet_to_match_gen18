-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 10-09-2026 a las 22:49:29
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `meet_to_match_gen18`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bloques_horarios`
--

CREATE TABLE `bloques_horarios` (
  `id` int(11) NOT NULL,
  `evento_id` int(11) DEFAULT NULL,
  `inicio` datetime NOT NULL,
  `fin` datetime NOT NULL,
  `etiqueta` varchar(120) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `bloques_horarios`
--

INSERT INTO `bloques_horarios` (`id`, `evento_id`, `inicio`, `fin`, `etiqueta`, `activo`, `created_at`) VALUES
(1, 1, '2026-07-08 09:00:00', '2026-07-08 09:30:00', '09:00 - 09:30', 1, '2026-07-29 22:45:34'),
(2, 1, '2026-07-08 09:30:00', '2026-07-08 10:00:00', '09:30 - 10:00', 1, '2026-07-29 22:45:34'),
(3, 1, '2026-07-08 10:00:00', '2026-07-08 10:30:00', '10:00 - 10:30', 1, '2026-07-29 22:45:34'),
(4, 1, '2026-07-08 10:30:00', '2026-07-08 11:00:00', '10:30 - 11:00', 1, '2026-07-29 22:45:34'),
(5, 1, '2026-07-08 11:00:00', '2026-07-08 11:30:00', '11:00 - 11:30', 1, '2026-07-29 22:45:34'),
(6, 1, '2026-07-08 11:30:00', '2026-07-08 12:00:00', '11:30 - 12:00', 1, '2026-07-29 22:45:34'),
(7, 1, '2026-07-08 12:00:00', '2026-07-08 12:30:00', '12:00 - 12:30', 1, '2026-07-29 22:45:34'),
(8, 1, '2026-07-08 12:30:00', '2026-07-08 13:00:00', '12:30 - 13:00', 1, '2026-07-29 22:45:34'),
(9, 1, '2026-07-08 13:00:00', '2026-07-08 13:30:00', '13:00 - 13:30', 1, '2026-07-29 22:45:34'),
(10, 1, '2026-07-08 13:30:00', '2026-07-08 14:00:00', '13:30 - 14:00', 1, '2026-07-29 22:45:34'),
(11, 1, '2026-07-08 14:00:00', '2026-07-08 14:30:00', '14:00 - 14:30', 1, '2026-07-29 22:45:34'),
(12, 1, '2026-07-08 14:30:00', '2026-07-08 15:00:00', '14:30 - 15:00', 1, '2026-07-29 22:45:34'),
(13, 1, '2026-07-08 15:00:00', '2026-07-08 15:30:00', '15:00 - 15:30', 1, '2026-07-29 22:45:34'),
(14, 1, '2026-07-08 15:30:00', '2026-07-08 16:00:00', '15:30 - 16:00', 1, '2026-07-29 22:45:34'),
(15, 1, '2026-07-08 16:00:00', '2026-07-08 16:30:00', '16:00 - 16:30', 1, '2026-07-29 22:45:34'),
(16, 1, '2026-07-08 16:30:00', '2026-07-08 17:00:00', '16:30 - 17:00', 1, '2026-07-29 22:45:34'),
(17, 1, '2026-07-08 17:00:00', '2026-07-08 17:30:00', '17:00 - 17:30', 1, '2026-07-29 22:45:34'),
(18, 1, '2026-07-08 17:30:00', '2026-07-08 18:00:00', '17:30 - 18:00', 1, '2026-07-29 22:45:34'),
(19, 1, '2026-07-08 18:00:00', '2026-07-08 18:30:00', '18:00 - 18:30', 1, '2026-07-29 22:45:34'),
(20, 1, '2026-07-08 18:30:00', '2026-07-08 19:00:00', '18:30 - 19:00', 1, '2026-07-29 22:45:34'),
(21, 1, '2026-07-08 19:00:00', '2026-07-08 19:30:00', '19:00 - 19:30', 1, '2026-07-29 22:45:34'),
(22, 1, '2026-07-08 19:30:00', '2026-07-08 20:00:00', '19:30 - 20:00', 1, '2026-07-29 22:45:34'),
(23, 1, '2026-07-08 20:00:00', '2026-07-08 20:30:00', '20:00 - 20:30', 1, '2026-07-29 22:45:34'),
(24, 1, '2026-07-08 20:30:00', '2026-07-08 21:00:00', '20:30 - 21:00', 1, '2026-07-29 22:45:34'),
(25, 1, '2026-07-08 21:00:00', '2026-07-08 21:30:00', '21:00 - 21:30', 1, '2026-07-29 22:45:34'),
(26, 1, '2026-07-08 21:30:00', '2026-07-08 22:00:00', '21:30 - 22:00', 1, '2026-07-29 22:45:34'),
(27, 1, '2026-07-08 22:00:00', '2026-07-08 22:30:00', '22:00 - 22:30', 1, '2026-07-29 22:45:34'),
(28, 1, '2026-09-12 10:00:00', '2026-09-12 10:30:00', '10:00 - 10:30', 1, '2026-08-26 17:13:11'),
(29, 1, '2026-09-12 10:30:00', '2026-09-12 11:00:00', '10:30 - 11:00', 1, '2026-08-26 17:13:11'),
(30, 1, '2026-09-12 11:00:00', '2026-09-12 11:30:00', '11:00 - 11:30', 1, '2026-08-26 17:13:11'),
(31, 1, '2026-09-12 11:30:00', '2026-09-12 12:00:00', '11:30 - 12:00', 1, '2026-08-26 17:13:11'),
(32, 1, '2026-09-12 12:00:00', '2026-09-12 12:30:00', '12:00 - 12:30', 1, '2026-08-26 17:13:11'),
(33, 1, '2026-09-12 12:30:00', '2026-09-12 13:00:00', '12:30 - 13:00', 1, '2026-08-26 17:13:11'),
(34, 1, '2026-09-12 13:00:00', '2026-09-12 13:30:00', '13:00 - 13:30', 1, '2026-08-26 17:13:11'),
(35, 1, '2026-09-12 13:30:00', '2026-09-12 14:00:00', '13:30 - 14:00', 1, '2026-08-26 17:13:11'),
(36, 1, '2026-09-12 14:00:00', '2026-09-12 14:30:00', '14:00 - 14:30', 1, '2026-08-26 17:13:11'),
(37, 1, '2026-09-12 14:30:00', '2026-09-12 15:00:00', '14:30 - 15:00', 1, '2026-08-26 17:13:11');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `eventos`
--

CREATE TABLE `eventos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(180) NOT NULL,
  `slug` varchar(180) NOT NULL,
  `fecha_inicio` datetime DEFAULT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `eventos`
--

INSERT INTO `eventos` (`id`, `nombre`, `slug`, `fecha_inicio`, `fecha_fin`, `activo`, `created_at`) VALUES
(1, 'Tecnologias Disruptivas', 'tecnologias-disruptivas', '2026-07-08 09:00:00', '2026-07-08 22:30:00', 1, '2026-07-29 22:19:37');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `importaciones_luma`
--

CREATE TABLE `importaciones_luma` (
  `id` int(11) NOT NULL,
  `evento_id` int(11) DEFAULT NULL,
  `archivo` varchar(255) NOT NULL,
  `filas_total` int(11) NOT NULL DEFAULT 0,
  `creados` int(11) NOT NULL DEFAULT 0,
  `actualizados` int(11) NOT NULL DEFAULT 0,
  `omitidos` int(11) NOT NULL DEFAULT 0,
  `errores` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `importaciones_luma`
--

INSERT INTO `importaciones_luma` (`id`, `evento_id`, `archivo`, `filas_total`, `creados`, `actualizados`, `omitidos`, `errores`, `created_at`) VALUES
(1, 1, 'historico_luma_tecnologias_disruptivas.csv', 221, 214, 0, 7, 0, '2026-07-29 22:46:56'),
(2, 1, 'historico_luma_tecnologias_disruptivas.csv', 221, 0, 214, 7, 0, '2026-07-30 01:52:14'),
(3, 1, 'ProviDev Pre - crea universos para Videojuegos - Invitados - 2026-08-31-22-37-24.csv', 11, 6, 5, 0, 0, '2026-08-31 22:37:59'),
(4, 1, 'ProviDev Pre - crea universos para Videojuegos - Invitados - 2026-09-03-16-50-27.csv', 231, 33, 0, 198, 0, '2026-09-03 19:44:03');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitudes_reunion`
--

CREATE TABLE `solicitudes_reunion` (
  `id` int(11) NOT NULL,
  `solicitante_id` int(11) NOT NULL,
  `receptor_id` int(11) NOT NULL,
  `bloque_horario_id` int(11) DEFAULT NULL,
  `mensaje` text DEFAULT NULL,
  `disponibilidad_sugerida` varchar(40) DEFAULT NULL,
  `estado` enum('Pendiente','Aceptada','Rechazada') NOT NULL DEFAULT 'Pendiente',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `evento_id` int(11) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) DEFAULT NULL,
  `correo` varchar(150) NOT NULL,
  `empresa` varchar(150) DEFAULT NULL,
  `cargo` varchar(120) DEFAULT NULL,
  `tipo_usuario` enum('Asistente','Expositor','Organizador','Developer') NOT NULL DEFAULT 'Asistente',
  `intereses` text DEFAULT NULL,
  `busca` text DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `origen` enum('manual','luma','demo') NOT NULL DEFAULT 'manual',
  `luma_guest_id` varchar(100) DEFAULT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `luma_estado` varchar(40) DEFAULT NULL,
  `luma_ticket` varchar(120) DEFAULT NULL,
  `luma_checked_in_at` datetime DEFAULT NULL,
  `luma_qr_url` text DEFAULT NULL,
  `luma_created_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `evento_id`, `nombre`, `apellido`, `correo`, `empresa`, `cargo`, `tipo_usuario`, `intereses`, `busca`, `descripcion`, `origen`, `luma_guest_id`, `telefono`, `luma_estado`, `luma_ticket`, `luma_checked_in_at`, `luma_qr_url`, `luma_created_at`, `created_at`, `updated_at`) VALUES
(449, 1, 'Joaquín', 'Aranda', 'jokermansaibot20@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-UImWHi9T9hSpjxM', '+56999771069', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=q46A0nPur3QEpUB', '2026-09-03 16:44:41', '2026-09-03 19:44:03', NULL),
(450, 1, 'Juan', 'Carlos', 'tucara097@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-JrOmN8AKJhfPXmg', '+56940117807', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=emslAR1SqHZHY2d', '2026-09-01 19:02:19', '2026-09-03 19:44:03', NULL),
(451, 1, 'Sebastián', 'Zumelzu', 'szumelzucastro@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-qEn5ZAQJ1vPcGU2', '+56991823679', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=gICklaviU0Rzk7A', '2026-09-03 15:43:21', '2026-09-03 19:44:03', NULL),
(452, 1, 'Martin', 'Philip Gutierrez Kuruz', 'martin.kuruzg@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-9sK4G81qpJgPisI', '+56947901054', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=02N9ET9LFC3XG1J', '2026-09-03 14:14:05', '2026-09-03 19:44:03', NULL),
(453, 1, 'Marcos', 'Fantoval', 'marcos.fantoval@mail.udp.cl', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-NR4yBqH98kDjTmr', '+56988877055', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=jEFkCcOMCUAPLd5', '2026-09-03 14:08:22', '2026-09-03 19:44:03', NULL),
(454, 1, 'Kevin', 'Castillo', 'kevinacastles@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-qvpVbi73vNfsG1k', '+56933063055', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=Zh2bEX6GSCRqm1U', '2026-09-03 03:55:39', '2026-09-03 19:44:03', NULL),
(455, 1, 'Byron', 'Quintanilla', 'by.quintanilla23@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-HECCR3o6IoA0kvj', '+56958518613', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=6uNZDM0eGDnLTeC', '2026-09-03 00:53:20', '2026-09-03 19:44:03', NULL),
(456, 1, 'Benjamin', 'Javier', 'b.monasterio@duocuc.cl', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-x7ElE00sEdZXNQ7', '+56991535425', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=MleCG4J9SLGhMaU', '2026-09-01 19:02:19', '2026-09-03 19:44:03', NULL),
(457, 1, 'Mariella', '', 'mariella.espanag@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-cgSNlpDuBYuFDz9', '+56990208799', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=rgJUrJUPsb6PAtf', '2026-09-02 23:06:28', '2026-09-03 19:44:03', NULL),
(458, 1, 'Miguel', 'Gil', 'miguel.gil.9210@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-vO2iTtGmGbK6Oee', '+56977221088', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=G2fC3hvjVmK0fle', '2026-09-02 22:59:03', '2026-09-03 19:44:03', NULL),
(459, 1, 'Marcelo', 'Jimenez', 'marcelojimenezraw@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-GicTcMvO8Erigpv', '+56983684060', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=rEvfbe7Tp3s5G1R', '2026-09-02 22:11:02', '2026-09-03 19:44:03', NULL),
(460, 1, 'Arriaza', '', 'danielcarriaza@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-K1You0GvNTGhV5P', '+56981229571', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=PPxJkk0p8HSCttv', '2026-09-02 22:00:42', '2026-09-03 19:44:03', NULL),
(461, 1, 'Benjamin', '', 'bmunos005@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-rtXrNuYLrkmZjxi', '+56955965559', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=6Ro0vanPJWJj7Zr', '2026-09-02 21:45:08', '2026-09-03 19:44:03', NULL),
(462, 1, 'Oscar', 'Alvarez', 'vipagiggs@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-QBxL37yGOkwEhBw', '+56974738796', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=us0mUhBvYwV7WC1', '2026-09-01 19:02:19', '2026-09-03 19:44:03', NULL),
(463, 1, 'David', 'Antunes', 'dvdantunes+luma@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-1dgWhvtMTZHiEOs', '+56952496480', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=2V2Jd2utNymV0lt', '2026-09-02 06:42:33', '2026-09-03 19:44:03', NULL),
(464, 1, 'Vicente', 'Wolde', 'vicentewolde@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-EaH10pj5asADwTu', '+56985090820', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=AgRmcyeFPhMjdYw', '2026-09-01 19:02:19', '2026-09-03 19:44:03', NULL),
(465, 1, 'Gonzalo', 'Camps', 'gonzalocampsv@gmail.com', '', '', 'Organizador', '', '', '', 'luma', 'gst-Eec2qSXfSCIjKcg', '+56994502588', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=2y1rzsxs3mAFHKU', '2026-09-01 19:02:19', '2026-09-03 19:44:03', '2026-09-03 19:44:21'),
(466, 1, 'Danilo', 'Contreras', 'dcontrerasl@live.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-3Aof7o2HDOn2AQC', '+56968717130', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=fVWUdm1xvajpExg', '2026-09-01 19:00:32', '2026-09-03 19:44:03', NULL),
(467, 1, 'Nazareth', 'S.', 'azreth3d@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-xvIIhamWJ6i7Gzr', '+56945718832', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=IWRAswdS3zqD8i0', '2026-09-01 16:28:21', '2026-09-03 19:44:03', NULL),
(468, 1, 'Andres', 'Carreño', 'aczproduccion@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-olnragZEfh4pWY1', '+56940502936', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=8aVIkLqU9BskcRJ', '2026-09-01 13:22:12', '2026-09-03 19:44:03', NULL),
(469, 1, 'Vicente', 'Ferreira', 'visho.ferreira@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-vJ6fP92JhrgKmEb', '+56993426305', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=IcSdrnRGDPhyr3h', '2026-09-01 10:15:28', '2026-09-03 19:44:03', NULL),
(470, 1, 'Francisco', 'Javier Cisternas', 'otromvndoverde@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-Haf0jpgGDy4ClQY', '+56953174556', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=NSWXgc5ltoC0R5e', '2026-09-01 04:00:09', '2026-09-03 19:44:03', NULL),
(471, 1, 'Joseph', 'Mosheh', 'joseph.jara.bustos@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-URUEehFUOE7h5qI', '+56984387713', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=0nDD1l5hgD6ssOt', '2026-08-31 20:25:36', '2026-09-03 19:44:03', NULL),
(472, 1, 'Oscar', '', 'oscarivals19@hotmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-4Sda2U5GWvIpM3J', '+56947095829', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=e7s8i1k0FGh4xHR', '2026-08-31 00:45:25', '2026-09-03 19:44:03', NULL),
(473, 1, 'Jose', 'Cortes', 'joseenrique.cdv@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-f76HaSAXoZ3RpfI', '+56958792397', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=10QEDMK1JaEOEHs', '2026-08-29 22:23:45', '2026-09-03 19:44:03', NULL),
(474, 1, 'Amaranta', 'Puente', 'amaranta.puente0@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-mdwj8dMedHZHheO', '+56978986957', 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=lMSPMFRMPPHTl5C', '2026-08-29 19:54:26', '2026-09-03 19:44:03', NULL),
(475, 1, 'Samuel', 'Gonzalez', 'samuelgonzalezliberona@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-blDFa8curGXv4v0', NULL, 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=WQkNbvThnBcRK30', '2026-08-29 02:44:36', '2026-09-03 19:44:03', NULL),
(476, 1, 'CAMILO', 'YONHSON CISTERNAS', 'satoshitothemoon.cl@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-vExCNfzHTgpwfl0', NULL, 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=aRe9BtemUlPY1wo', '2026-08-28 22:59:25', '2026-09-03 19:44:03', NULL),
(477, 1, 'Marcos', 'Vinicio', 'marcos.reyes.m@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-KLMCN8LtLSr8cL2', NULL, 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=vZeu1ZMkGkslTFt', '2026-08-28 22:56:01', '2026-09-03 19:44:03', NULL),
(478, 1, 'Brauxelion', '', 'brauxelion@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-YGgEkCtbiSuKVFK', NULL, 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=lF4xLq7uNOm1evE', '2026-08-28 22:17:10', '2026-09-03 19:44:03', NULL),
(479, 1, 'Jorge', 'Mardones', 'jecarpanetti@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-zmVZC7asEBcDBgl', NULL, 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=RXV6c7ArVYJnJst', '2026-08-28 21:45:03', '2026-09-03 19:44:03', NULL),
(480, 1, 'Cabs', 'Brown', 'cabscryptocontacto@gmail.com', '', '', 'Organizador', '', '', '', 'luma', 'gst-3xa49xO2DCPulx5', NULL, 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=jNQbjf5LxcPDBYu', '2026-08-28 16:27:21', '2026-09-03 19:44:03', '2026-09-03 19:44:15'),
(481, 1, 'Genaro', '', 'genaroclaps@gmail.com', NULL, NULL, 'Asistente', NULL, NULL, NULL, 'luma', 'gst-mCiIs5SwdW7zUrc', NULL, 'approved', 'Standard', NULL, 'https://luma.com/check-in/evt-BQSRL4JBacba4WZ?pk=1U7GYg0zN5DMs98', '2026-08-26 14:39:39', '2026-09-03 19:44:03', NULL),
(482, 1, 'Yerko', 'García', 'hello@deadlycrowgames.com', 'DeadlyCrow Games', 'Community & Partnership Manager', 'Developer', 'Conseguir wishlists, Encontrar publisher, Encontrar inversionistas, Conseguir cobertura de prensa', 'Publisher, Financiamiento', 'En medio de la guerra, un horror mucho más personal echa raíces en casa. Tu madre se está convirtiendo en un monstruo. Sobrevive, descubre la verdad y enfrenta un vínculo desgarrador en esta aventura narrativa de terror con una estética única de stop-motion.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(483, 1, 'Isaías', 'Arrué', 'isaias.arrue@panpipestudio.com', 'Panpipe Studio', 'CEO, Director', 'Developer', 'Conseguir jugadores, Recibir feedback, Conseguir cobertura de prensa, Conectar con otros desarrolladores', NULL, 'En Colorbound, el color es más que solo un matiz. Únete a Anku en un conmovedor viaje usando el color para moldear el mundo que te rodea. En esta aventura de puzles y plataformas resolverás desafiantes rompecabezas, descubrirás secretos y ayudarás a una familia de músicos a reunirse como en los viejos tiempos para un concierto de despedida.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(484, 1, 'Dan', '', 'bydandans@gmail.com', 'byDanDans', 'CEO, Desarrollador', 'Developer', 'Conseguir jugadores, Conseguir cobertura de prensa', 'mas reach', 'The Trolley Solution es una recopilación de minijuegos point-and-click basada en el famoso experimento mental propuesto originalmente por Philippa Foot.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(485, 1, 'Amaro', 'Saiz (Tewaler)', 'gamepatluk@gmail.com', 'Tewaler', 'SoloDev', 'Developer', 'Conseguir jugadores, Recibir feedback, Conseguir cobertura de prensa, Conectar con otros desarrolladores, Promocionar un lanzamiento próximo', NULL, 'Patluk es un juego de rol de mundo abierto futurista en el que tomas decisiones que afectan al curso de la narrativa. Explora sus ciudades, interactúa con sus habitantes y elige qué bando apoyar.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(486, 1, 'Walter', 'Veneros', 'walter.veneros@ulpomedia.com', 'Ulpo Media', 'CEO', 'Developer', 'Conseguir wishlists, Conseguir jugadores, Recibir feedback, Encontrar publisher, Encontrar inversionistas, Conseguir cobertura de prensa', 'Publisher, Inversión, Marketing, Porting, Financiamiento', 'Es un juego de plataforma 3d, donde Dana, una aventurera se queda atrapada en un mundo digital que recorre las distintas épocas de las estéticas del internet. Ayuda a Dana a escapar de este mundo digital.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(487, 1, 'Ricardo', 'Neira Artigas', 'changomangoyt@gmail.com', 'ChangoMango EXP', 'CEO, Productor, Desarrollador, Director', 'Developer', 'Conseguir wishlists, Conseguir jugadores, Recibir feedback, Conseguir cobertura de prensa, Conectar con otros desarrolladores, Promocionar un lanzamiento próximo', NULL, 'Un maestro alfarero llega al infierno en misteriosas circunstancias. Con tus habilidades, deberás modelar piezas para los habitantes del inframundo. Sobrevive, mejora tus confecciones, conoce a tus nuevos vecinos e intenta descubrir los misterios de las profundidades.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(488, 1, 'Javier', 'Larrain', 'larrain.hormazabal@gmail.com', 'Jotaz Games', 'SoloDev', 'Developer', 'Conseguir wishlists, Conseguir jugadores, Recibir feedback', 'Inversión, Marketing', 'Yokai Crossing es un juego de terror basado en físicas inspirado en las películas de terror japonesas. Jugarás como Ryo, un estudiante que junto a sus amigos construye una cámara para ver a los muertos, la cual probarán en una casa en donde un niño de 7 años ha desaparecido sin dejar rastro.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(489, 1, 'Alfredo', 'Avalos', 'fero.avalos@gmail.com', 'Neverending Lab', 'SoloDev', 'Developer', 'Conseguir wishlists, Conseguir jugadores, Recibir feedback, Encontrar publisher, Encontrar inversionistas, Conseguir cobertura de prensa, Conectar con otros desarrolladores', 'Publisher, Inversión, QA, Feedback de negocio, Feedback de producción', 'Pirate Troops es un RPG táctico que fusiona la narrativa y el humor de las aventuras gráficas con el combate estratégico y la progresión de los RPG clásicos de Super Nintendo y PlayStation.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(490, 1, 'Ricardo', 'Concha', 'rconcha@nemorisgames.com', 'Nemoris Games', 'CEO, Desarrollador, Director', 'Developer', 'Conseguir wishlists, Conseguir jugadores, Encontrar inversionistas, Conseguir cobertura de prensa', 'Inversión, Marketing, Financiamiento', 'Tu hermana desapareció hace 15 años. Ahora has vuelto y lo que sea que se la llevó sigue ahí. Terror psicológico en primera persona. Revive sus recuerdos como experiencias jugables. Conecta tu teléfono real para detectar y enfrentarte a las amenazas.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(491, 1, 'Manuel', 'Leiva', 'manuelleiva1984@gmail.com', 'BadClusterGames', 'SoloDev', 'Developer', 'Recibir feedback, Encontrar publisher, Encontrar inversionistas, Conectar con otros desarrolladores, Promocionar un lanzamiento próximo', 'Publisher, Inversión, Financiamiento', 'es un plataforma pensado para nuevos jugadores o niños, que utiliza el mouse o puntero para controlar todo el juego', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(492, 1, 'Leonardo', 'Oñate Lara', 'contacto@quitralgames.com', 'Quitral Games', 'SoloDev', 'Developer', 'Conseguir wishlists, Recibir feedback, Encontrar publisher, Encontrar inversionistas, Conseguir cobertura de prensa', 'Publisher, Inversión, Marketing', 'BALSEO: The Sea Beyond es una aventura de sigilo envuelta en una oscura atmósfera mitológica. Domina las sombras, aprende poderosos hechizos y huye del peligro. Explora un archipiélago misterioso y descubre qué se oculta tras la niebla.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(493, 1, 'Alejandro', 'Silva', 'alejandrosilvas50@gmail.com', 'AuroraPixel', 'Desarrollador', 'Developer', 'Conseguir jugadores, Recibir feedback, Conectar con otros desarrolladores', 'Marketing, Financiamiento, Feedback de producción', 'Souls Runner es un juego indie de aventura y plataformas 3D donde dos almas deben escapar del infierno usando sus habilidades para superar obstáculos y sobrevivir al perseguidor, una entidad imparable.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(494, 1, 'Nahuel', 'Paillapi', 'paillapif@gmail.com', 'Naikanimax', 'CEO, Productor, Desarrollador, SoloDev, Director', 'Developer', 'Conseguir wishlists, Conseguir jugadores, Recibir feedback, Conseguir cobertura de prensa, Conectar con otros desarrolladores', 'Publisher, Marketing, QA, Financiamiento', 'viajas por', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(495, 1, 'Francisco', 'Pino Sáez', 'evilspout@gmail.com', 'SOULBATTERY', 'CEO, Productor, Desarrollador, Director', 'Developer', 'Conseguir wishlists, Conseguir cobertura de prensa, Conectar con otros desarrolladores, Promocionar un lanzamiento próximo', 'Marketing', 'ZOMBI ROCKSTAR es un videojuego “hack and slash” 2D plataformero que hará un riff infernal desatando la epidemia del old school + rock + zombis a través de una historia trepidante y frenética.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(496, 1, 'Ignacio', 'Arancibia', 'sleepydoggames@gmail.com', 'Sleepy Dog Games', 'SoloDev', 'Developer', 'Conseguir wishlists, Conseguir cobertura de prensa, Conectar con otros desarrolladores', 'Marketing', 'Kyubu Kyubu Dice es un juego puzzle de acción en el que haces rodar un dado mágico para despejar paneles de colores. Requiere lógica espacial: debes maniobrar el dado para que la cara correspondiente caiga perfectamente sobre los colores del escenario. ¡Fácil de entender, pero difícil de dominar! ¡Es una experiencia de juego divertida y adictiva!', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(497, 1, 'Genaro', 'Urzúa', 'rustyrazorgames@outlook.com', 'Rusty Razor Games', 'Desarrollador, Director, Guionista', 'Developer', 'Conseguir wishlists, Conseguir jugadores, Recibir feedback, Encontrar publisher, Conseguir cobertura de prensa, Conectar con otros desarrolladores', 'Publisher, Marketing, QA, Porting', '“TREN: Southbound” es un Roguelite 2D con vista Top Down que incluye elementos RPG centrado en el combate y la exploración.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(498, 1, 'Oscar', 'Silva', 'contacto@fernelstudios.com', 'Fernel Studios', 'Productor', 'Developer', 'Conseguir jugadores, Recibir feedback', 'Marketing, QA, Financiamiento, Feedback de negocio', 'Hellkrayne es un juego clicker/incremental 2D con perspectiva isométrica, donde encarnas a un poderoso guerrero forjado en magia y furia.\r\n\r\nDeberás infiltrarte en el castillo del rey Elgarth y obligarlo a cumplir la parte del trato que hizo para salvar su reino.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(499, 1, 'Jinwe', '', 'kill9game@gmail.com', 'Jinwe', 'SoloDev', 'Developer', 'Conseguir jugadores, Conseguir cobertura de prensa, Conectar con otros desarrolladores', 'Marketing, Porting', 'KILL -9 es un deckbuilder roguelike de un jugador. Cada run, construyes tu mazo con cartas de ataque, defensa y utilidad. Combínalas con más de 50 daemons para crear sinergias que el sistema no verá venir. Más de 70 cartas disponibles. No eres un jugador. Eres un proceso consciente atrapado en las capas más bajas del sistema. Tu objetivo: llegar a la raíz, derrocar al sistema operativo e instalarte en su lugar. El sistema no va a ponértelo fácil.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(500, 1, 'Yuselen', 'Rivero', 'team@inloopstudios.com', 'Inloop Studios', 'CEO, Desarrollador, Director, Level Design, Artist', 'Developer', 'Conseguir wishlists, Conseguir jugadores, Recibir feedback, Encontrar publisher, Encontrar inversionistas, Conseguir cobertura de prensa, Conectar con otros desarrolladores, Promocionar un lanzamiento próximo', 'Publisher, Inversión, Marketing, Financiamiento, Feedback de negocio, Feedback de producción', 'Shadows of Christmas Eve es un juego de terror psicológico en primera persona donde exploras una casa consumida por pesadillas mientras descubres un antiguo misterio familiar. Resuelve acertijos, evita a las entidades que te persiguen y descubre qué ocurrió realmente antes de que sea demasiado tarde.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(501, 1, 'Felipe', 'Troncoso', 'bross.devlab@gmail.com', 'BrossLab', 'CEO', 'Developer', 'Conseguir jugadores, Encontrar publisher, Encontrar inversionistas, Conseguir cobertura de prensa, Conectar con otros desarrolladores, Promocionar un lanzamiento próximo', 'Publisher, Inversión, Marketing, Financiamiento, Feedback de negocio', 'En la oscuridad absoluta de tu hogar, eres un niño solo e indefenso, acechado por una entidad siniestra que se oculta entre las sombras. Resuelve acertijos, enfréntate a entornos cambiantes y descubre un terrible secreto.\r\n\r\nJuego de terror en primera persona en la perspectiva de un niño, con sustos sorpresivos, pocas pistas y una trama bastante oscura.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(502, 1, 'Barbara', 'Messina', 'coibitestudios@gmail.com', 'Coi-Bite Studios', 'CEO, Director', 'Developer', 'Conseguir jugadores, Recibir feedback, Conseguir cobertura de prensa, Conectar con otros desarrolladores', 'Publisher, QA', 'Vestigia es un survival horror en primera persona ambientado en locaciones reales de San Antonio, Chile, donde el jugador explora leyendas del litoral central, resuelve misterios y sobrevive a entidades sobrenaturales en una experiencia inspirada en el horror analógico y el found footage.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(503, 1, 'Matías', 'Mellado', 'matias.mellado@arthemystudios.com', 'Arthemy Studios', 'Productor, Desarrollador', 'Developer', 'Recibir feedback', 'Publisher, Inversión, QA, Financiamiento, Feedback de negocio, Feedback de producción', 'Sigue la pista de los gatos perdidos y resuelve el misterio de sus desapariciones.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(504, 1, 'César', 'Patricio Jara Figueroa', 'cjaragamedev@gmail.com', 'César Patricio Jara Figueroa', 'Director', 'Developer', 'Conseguir wishlists, Conseguir jugadores, Recibir feedback, Conseguir cobertura de prensa, Conectar con otros desarrolladores', NULL, 'Novela visual ambientada en Chile, 1973. La dictadura se alza y una familia de hermanos intenta vivir su día a día, interrumpido por las actividades del régimen. Serás acorralado y obligado a tomar decisiones que pondrán a prueba tu moralidad. Pero recuerda: cada decisión tendrá su consecuencia.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(505, 1, 'Ignacio', 'Farias', 'ignaciofariast@gmail.com', 'Eternal Echoes VR', 'SoloDev', 'Developer', 'Conseguir jugadores, Recibir feedback, Encontrar inversionistas, Conseguir cobertura de prensa, Conectar con otros desarrolladores, Promocionar un lanzamiento próximo', 'Inversión, Financiamiento, Feedback de negocio, Feedback de producción', 'The OmniGallery es un multiverso de exhibiciones de arte en realidad virtual, constantemente expandiéndose con lo mejor del arte del pasado y futuro, desde Da Vinci hasta obras 3D del presente. Usando el poder de la realidad virtual, puedes experimentar cientos de obras de todo el mundo como si estuvieras al frente de ellas. Por ahora cuenta con 4 universos y muchos más planeados.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(506, 1, 'Renato', 'Campos', 'Renaxd13@gmail.com', 'HALLEY & NATO', 'CEO, Desarrollador, Director', 'Developer', 'Conseguir jugadores, Recibir feedback, Encontrar inversionistas, Conseguir cobertura de prensa, Conectar con otros desarrolladores', 'Publisher, Inversión, Marketing, QA, Porting, Financiamiento, Feedback de negocio, Feedback de producción', 'Tenebrarium es un roguelike ASCII de mazmorras, por turnos. Cada piso se genera de forma distinta, así que el mapa nunca se repite. Se elige entre Guerrero, Mago o Ranger, y se avanza administrando los Puntos de Acción en cada combate. La muerte es permanente: no hay guardado manual, así que hay que empezar de nuevo si el personaje muere.\r\n\r\nEn el camino hay inventario, pociones, cofres, salas secretas y un mercader en cada piso para comprar y vender antes de seguir bajando. La dificultad aumenta piso a piso, por lo que hay que ir mejorando al personaje al mismo ritmo.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(507, 1, 'Fabrizio', 'Ogalde', 'fbrzdcl@gmail.com', 'FBRZD', 'SoloDev', 'Developer', 'Conseguir wishlists, Recibir feedback, Encontrar publisher, Promocionar un lanzamiento próximo', 'Publisher, Financiamiento, Feedback de negocio, Feedback de producción', 'Colecciona, entrena y lucha con tus Chibits en un juego de cartas ágil. Gestiona tus criaturas entre partidas, domina el combate táctico y viaja por un espacio ramificado donde cada decisión cambia tu destino.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(508, 1, 'benjamin', 'bla', 'benjamin.blas.m@gmail.com', 'lab lasagna', 'SoloDev', 'Developer', 'Conseguir jugadores, Recibir feedback, Conseguir cobertura de prensa, Conectar con otros desarrolladores, Promocionar un lanzamiento próximo', 'Publisher, Marketing, QA, Feedback de producción', 'Star Lane es un roguelike 2D pixel-art para Android desarrollado de forma independiente. El jugador controla a un astronauta que atraviesa 12 corredores temáticos basados en los signos del zodiaco, cada uno asociado a un elemento — Fuego, Tierra, Aire o Agua — con sus propios obstáculos y mecánicas. Entre corredor y corredor, el jugador descansa en zonas de seguridad donde puede curarse, recargar energía, comprar ítems y tomar decisiones que afectan el resto de la partida. Con 67 ítems, un árbol de habilidades permanente y un modo Loop infinito tras completar los 12 signos, Star Lane combina rejugabilidad profunda con una estética poco común que mezcla pixel-art con normal maps y una banda sonora original de 13 pistas.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(509, 1, 'Nicolás', 'Jaramillo', 'ibisinteractive@gmail.com', 'Ibis Interactive', 'CEO, Productor, Desarrollador, Director', 'Developer', 'Conseguir wishlists, Conseguir jugadores, Recibir feedback, Encontrar publisher, Encontrar inversionistas, Conseguir cobertura de prensa, Conectar con otros desarrolladores, Promocionar un lanzamiento próximo', 'Publisher, Inversión, Marketing, Porting, Financiamiento, Localización a portugués brasileño y posiblemente otros', 'Un juego party para hasta 4 jugadores donde peleas con bombitas de agua!\r\nDon Pepe y sus globos es el programa número 1 de la televisión, donde competidores de todo el mundo compiten en intensas batallas de globos de agua. ¿Tienes lo necesario para ser Campeón?\r\n\r\nEscoge entre una variedad de coloridos personajes, cada uno con sus propios stats y estilo de juego, y pelea en diferentes modos incluyendo todos contra todos, batalla por equipo, torneo y más.\r\nPrueba el Modo Arcade para divertirte solo o juega el Modo Historia para conocer más sobre Don Pepe, su programa de televisión, y los niños que finalmente derribarán su imperio mediático.\r\n\r\nDemo disponible en Steam incluyendo 9 personajes, 4 etapas aleatorias, Modo Batalla todos contra todos y Modo Arcade.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(510, 1, 'Pablo', 'Toro', 'pablotoroavila@gmail.com', 'Shifting Realms', 'Desarrollador', 'Developer', 'Conseguir wishlists, Conseguir jugadores, Recibir feedback', 'Feedback de producción', 'Dungeon Shifters es un action RPG que se desarrolla en el año 0 de un mundo azotado por la caída de un cometa y los primeros aventureros deciden llegar al origen para entender los daños en el mundo, como jugador explorarás mazmorras, enfrentarás jefes únicos y desbloquearás nuevas armas y habilidades con cada expedición. Domina un combate estratégico, encuentra nuevos aventureros y descubre secretos mientras luchas por sobrevivir en un mundo con nuevas reglas.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(511, 1, 'Leticia', 'Díaz', 'Merewhyn@gmail.com', 'Pepitas Playground', 'Desarrollador, Director', 'Developer', 'Conseguir jugadores, Recibir feedback, Encontrar publisher, Encontrar inversionistas, Conseguir cobertura de prensa, Conectar con otros desarrolladores', 'Publisher, Inversión, Feedback de producción', 'Seed You Later es un juego de fantasía centrado alrededor de Pepper Pepita, una semilla de manzana modificada para convertirse en el próximo árbol de gran manzana. La historia sigue a Pepper a través de su viaje por el espacio exterior en distintos planetas que funcionan como niveles, buscando un nuevo hogar.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(512, 1, 'Sofia', 'Fraile Alvarado', 'plasticfroggames@gmail.com', 'Veilbound Studios', 'Publisher', 'Developer', 'Conseguir wishlists, Conseguir cobertura de prensa, Conectar con otros desarrolladores', 'QA, Feedback de producción', 'Forgotten - Whispers of the Past es un juego de horror en primera persona ambientado en un colegio abandonado del sur de Chile. Como cuidador nocturno del colegio, armado solo con tu linterna, debes investigar los hechos que ocurren una noche de lluvia, mientras sobrevives a extrañas criaturas y resuelves puzzles para abrirte paso.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(513, 1, 'Diego', 'Gajardo', 'info@plasticfroggames.com', 'Matías Avilés', 'Publisher', 'Developer', 'Conseguir cobertura de prensa, Conectar con otros desarrolladores', NULL, 'Juego de horror en primera persona donde te pierdes en el metro Baquedano de Santiago y debes escapar de Tung Tung Sahur. Es un juego que mezcla humor con momentos de sustos.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(514, 1, 'Francisco', 'Pezoa', 'pan.panshios@gmail.com', 'Francisco \"Pan\" Pezoa', 'SoloDev', 'Developer', 'Conseguir wishlists, Conseguir cobertura de prensa, Conectar con otros desarrolladores, Promocionar un lanzamiento próximo', 'Marketing, Financiamiento', 'Bizameka es un Action Shot\'em up que se inspira y parodia de distintas piezas de media del género Mecha de los últimos 50 años. Nos sitúa en un futuro en donde diferentes entidades a lo largo del universo se coordinan para invadir la tierra en conjunto, mientras un grupo de diversos personajes y sus mechas se encargan de detenerlos.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(515, 1, 'Marco', 'Palominos', 'puppeteers.devs@gmail.com', 'Puppeteers Devs', 'CEO, Desarrollador', 'Developer', 'Conseguir wishlists, Recibir feedback, Encontrar publisher, Encontrar inversionistas, Conseguir cobertura de prensa, Conectar con otros desarrolladores, Promocionar un lanzamiento próximo', 'Publisher, Inversión, Financiamiento', 'Puppetsite es un juego de terror psicológico narrativo. Un inquietante títere se aferra a tu brazo. Encuentra la forma de liberarte... pero no lo despiertes. Podría ser el fin para ti.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(516, 1, 'José', '\"Hoke\" Rojas', 'hoke@timehunterstudios.com', 'Time Hunters SpA', 'CEO', 'Developer', 'Conseguir wishlists', 'Publisher', 'Isekai Guild es un RPG por equipos con estética anime y elementos de gestión de gremio. Juega como Hikaru Sato, un ejecutivo reencarnado en el mundo fantástico de Vastena, y reconstruye un gremio olvidado desde sus ruinas. Recluta aventureros, forma equipos, administra recursos, completa misiones y toma decisiones que afectarán las relaciones, la reputación del gremio y el desarrollo de la historia.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(517, 1, 'Natalia', 'Araya Avilés', 'consedcity@gmail.com', 'Asociación Gamer Consedcity', 'Director', 'Developer', 'Conseguir jugadores, Recibir feedback, Encontrar inversionistas, Conseguir cobertura de prensa, Conectar con otros desarrolladores', 'Marketing, Financiamiento, Feedback de negocio, Feedback de producción', 'PixelFest es un juego arcade rápido y frenético compuesto por una colección de divertidos microjuegos. En esta aventura encarnas a Kai, la mascota felina oficial de un gran evento gamer que está siendo saboteado por un misterioso Hacker.\r\n\r\nArmado con tus reflejos y agilidad, tendrás que recorrer las distintas zonas para resolver imprevistos a toda velocidad: desde controlar los accesos y sincronizar el ritmo de la música, hasta atrapar ladrones de datos y golpear al hacker cuando intente asomarse por la infraestructura. La amenaza cambia en cada partida, ¡así que abre bien los ojos para descubrir el destello verde del villano antes de que se te agote el tiempo y las vidas!', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(518, 1, 'Francisco', 'Vargas', 'fevarga1@uc.cl', 'Los Tres Primos', 'Desarrollador', 'Developer', 'Conseguir wishlists, Conseguir jugadores, Recibir feedback, Encontrar publisher, Conseguir cobertura de prensa, Conectar con otros desarrolladores, Promocionar un lanzamiento próximo', 'Publisher, Marketing, QA, Feedback de negocio, Feedback de producción', 'Count the signs. Watch the road. Don\'t let your father down. A short psychological horror game about a quiet drive home.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(519, 1, 'Raul@cloudcreatures.cl', '', 'Raul@cloudcreatures.cl', 'Cloud Creatures Studios', 'Productor, Desarrollador', 'Developer', 'Conseguir wishlists, Encontrar inversionistas, Conseguir cobertura de prensa', 'Publisher, Inversión, Marketing, Financiamiento', 'Ink of Fate is a third-person, single-player, 3D puzzle adventure game for PC, set in a fantasy world of books in which Helena, the protagonist, struggles to rewrite her destiny. The player\'s main objective is to collect sheets of paper, using Helena and rotating the camera to explore, discover and solve all the secrets of each level. The player will also encounter enemies to defeat as they progress through the story and face powerful world bosses.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(520, 1, 'Héctor', 'Carrillo', 'workingpenguinsgames@gmail.com', 'Working Penguins Games', 'CEO, Productor, Director', 'Developer', 'Conseguir wishlists, Conseguir jugadores, Recibir feedback, Conectar con otros desarrolladores', 'Marketing, Financiamiento, Feedback de producción', 'Tales from the Dark Manor es una novela visual narrativa donde encarnas a un periodista en la ruina que dispone de poco tiempo para entrevistar a seres sobrenaturales dentro de una misteriosa mansión donde las leyes de la lógica dejan de existir. Cada decisión revela un nuevo secreto.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(521, 1, 'Linwi', 'Vargas Campos', 'expropiaciondigital@gmail.com', 'Expropiación Digital', 'Productor', 'Developer', 'Recibir feedback, Encontrar publisher, Encontrar inversionistas, Conseguir cobertura de prensa, Conectar con otros desarrolladores, Promocionar un lanzamiento próximo', 'Publisher, Marketing, QA, Porting, Financiamiento, Feedback de negocio, Feedback de producción', 'En un solitario pueblo, en el cual las leyendas populares dictan la realidad al ser repetidas como verdad única por sus habitantes. Une joven emprenderá desafíos fuera de su zona de confort para enfrentar por sí misme a “les monstrues” que protagonizan estas historias. Las cuales parecen estar conectadas mediante las acciones de una malévola corporación que maneja todo el panorama del pueblo desde las sombras. Viéndose así le joven en una disyuntiva entre mantener estas visiones de mundo socialmente aceptadas o tener el valor necesario para desaprender sus prejuicios.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(522, 1, 'Constanza', 'Contreras', 'parallaxfoxgamedev@gmail.com', 'ParallaxFox', 'Productor', 'Developer', 'Conseguir wishlists, Conseguir jugadores, Recibir feedback, Encontrar publisher, Encontrar inversionistas, Conseguir cobertura de prensa, Conectar con otros desarrolladores, Promocionar un lanzamiento próximo', 'Publisher, Inversión, Marketing, Financiamiento, Feedback de negocio, Feedback de producción', 'Stick Out! Es un juego de plataformas de precisión donde debes usar una lanza para sortear obstáculos clavándote a las paredes y superficies. ¡Recoge monedas, compra aspectos, obtén estrellas y rompe los récords de tiempo!', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(523, 1, 'Matías', 'Montenegro', 'rrss.cgs@gmail.com', 'Crazy Goat Studios', 'Desarrollador', 'Developer', 'Conseguir wishlists, Conseguir jugadores', NULL, 'Dungeon of the Forgotten King es un RPG roguelite por turnos que combina arte pixelado con gráficos en 3D. Enfréntate a enemigos letales, reúne oro y botín, desbloquea mejoras permanentes, derrota a poderosos jefes y escapa de una misteriosa mazmorra donde cada muerte da forma a tu próxima aventura.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(524, 1, 'Fernanda', 'Fajre', 'nightwaveg@gmail.com', 'NightWave Games', 'Desarrollador', 'Developer', 'Promocionar un lanzamiento próximo', 'Marketing', 'Chromatic Battles es un shooter/estrategia 2D donde el color es tu arma. Controla una nave rotatoria, combina el tono de tus balas con el de los enemigos para derrotarlos y sobrevive a oleadas mientras recolectas cristales para salvar tu planeta. Con progresión por planetas, tienda entre niveles, nuevos colores y enemigos que aumentan la dificultad, y un estilo cartoon retro-futurista con banda sonora synthwave.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(525, 1, 'Pablo', 'Lastra', 'pablo@mosh.cl', 'Brekion', 'CEO', 'Developer', 'Recibir feedback, Conseguir cobertura de prensa, Conectar con otros desarrolladores', 'Financiamiento, Feedback de negocio, Feedback de producción', 'DynaTrip será un juego de plataformas de acción vertical (Action Climb Platformer) que combina la intensidad del combate táctico con la precisión de los saltos y los \"parries\", con una banda sonora rock original.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(526, 1, 'Joaquin', 'Martinez', 'benjijuacos@gmail.com', 'Joaking-dev', 'SoloDev', 'Developer', 'Conseguir wishlists, Encontrar inversionistas, Conseguir cobertura de prensa, Conectar con otros desarrolladores', 'Publisher, Inversión, Marketing, Porting, Financiamiento, Feedback de negocio, Feedback de producción', 'Space Evolver es un juego roguelite de gestión y genética, que incluye aspectos de juegos de estrategia en tiempo real. Mejora tu nave espacial y tecnologías, completa misiones y guía la evolución de especies', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(527, 1, 'Claus', 'Vicente Belmar Cid', 'hojitastudio@gmail.com', 'Hojita Studio', 'Desarrollador', 'Developer', 'Conseguir wishlists, Conseguir jugadores, Recibir feedback, Encontrar publisher, Encontrar inversionistas, Conseguir cobertura de prensa, Conectar con otros desarrolladores, Promocionar un lanzamiento próximo', 'Publisher, Inversión, Marketing, QA, Financiamiento, Feedback de negocio, Feedback de producción', 'Kami´s Garden es un juego de Acción/Aventura de vista isométrica que cuenta la historia de Kami, una chica que cayó misteriosamente dentro de un libro de relieve para niños, escrito por un extraño narrador quien los guiá a ambos a través de los peligros que esconde este mismo. Tu misión es ayudar a Kami a completar esta historia, salvando este mundo, o escapando de él.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(528, 1, 'Marcelo', 'Rojas', 'rojasm@ouchgames.cl', 'Ouch Games', 'CEO', 'Developer', 'Conseguir wishlists, Recibir feedback, Encontrar publisher, Encontrar inversionistas, Conseguir cobertura de prensa, Conectar con otros desarrolladores', 'Publisher, Inversión, Financiamiento', 'Atemporal Silentium es un ARPG en tercera persona que combina elementos técnicos de Hack and Slash con progresión y narrativa de RPG. Está ambientado en un mundo distópico steampunk donde el tiempo se encuentra suspendido y la realidad es presa de fracturas temporales que, por medio de fuerzas misteriosas están rasgando los cimientos de la realidad misma. Conforme el protagonista avance en su viaje, irá descubriendo las causas de esta realidad, el vínculo que él guarda con las fracturas, y cómo el ir descubriendo este entramado irá revelando la verdad de su pasado y su relación con las Fracturas.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(529, 1, 'Diego', 'Bravo', 'diegob12868@gmail.com', 'ButterSprite', 'CEO, Desarrollador', 'Developer', 'Conseguir wishlists, Recibir feedback, Encontrar publisher, Encontrar inversionistas, Conseguir cobertura de prensa, Conectar con otros desarrolladores', 'Publisher, Inversión, Marketing, QA, Porting, Financiamiento, Feedback de negocio, Feedback de producción', 'Sky Flowers es un juego de puzles plataformas que mezcla el 2D con el 3D. Puyo y su hijo Chuyo entran a una mega estatua en medio del desierto de Atacama buscando algo, y descubren que no pueden salir. Corre, rebota y usa el viento con el Flower Run, y rota los escenarios para revelar la tercera dimensión mientras exploras las zonas de la estatua y a los pueblos que las habitan', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(530, 1, 'Deborah', 'Ojeda', 'Deborahom8@gmail.com', 'Debonita ConkerVERSE', 'CEO, Productor, Desarrollador, SoloDev, Director', 'Developer', 'Conseguir wishlists, Conseguir jugadores, Recibir feedback, Encontrar publisher, Encontrar inversionistas, Conseguir cobertura de prensa, Conectar con otros desarrolladores', 'Publisher, Inversión, Marketing, Financiamiento', 'ITERUM es un videojuego de acción y aventura con combate físico, ritmo y decisiones narrativas. El jugador guía a Casseus, un ser que ha perdido su memoria, sus emociones y su identidad, y decide quién llegará a ser mediante los vínculos que construye y las consecuencias de sus actos. En este mundo, el tiempo funciona como vida, moneda y recurso: puede recolectarse, arriesgarse y utilizarse para volver atrás, pero reparar una decisión siempre tiene un costo. El combate combina ataque, parry y sincronización con el pulso de otros seres, mientras la historia revela fragmentos de un pasado que Casseus desconoce.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(531, 1, 'Rafael', '', 'chewbacan.contact@gmail.com', 'Chewbacan', 'SoloDev', 'Developer', 'Conseguir jugadores, Recibir feedback, Conectar con otros desarrolladores, Promocionar un lanzamiento próximo', 'Marketing, Porting, Feedback de negocio, Feedback de producción', 'Lanza a M.I.N.G (Robot recolector) lo más lejos posible para cosechar tus cultivos. Con lo recolectado mejoras a M.I.N.G para llegar cada vez más lejos.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(532, 1, 'Benjamín', 'Ignacio Sotelo Villalobos', 'HellBreezer123@gmail.com', 'Hell Team', 'Desarrollador, Director, Artista 2D y3D', 'Developer', 'Conseguir jugadores, Recibir feedback, Conectar con otros desarrolladores', 'Marketing, Feedback de negocio, Feedback de producción', 'Hell Breezer es un videojuego hack n\' slash donde deberás combatir múltiples hordas de enemigos, siéntete poderoso destruyendo a cada uno de ellos, mientras corres a toda velocidad manteniendo el momentum cada que puedas, Breezer podrá ser un oso grande, ¡pero puede ser bastante ágil en las manos correctas!', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(533, 1, 'Christofer', 'Morales', 'morales.christofer@gmail.com', 'Punk Óptico Games', 'Director', 'Developer', 'Recibir feedback, Encontrar inversionistas, Conseguir cobertura de prensa, Conectar con otros desarrolladores', 'Inversión, Financiamiento', 'Johan ha vuelto a Kalkuhue después de años. Se entretiene sacando fotos al frondoso paisaje, recorriendo sus escalinatas llenas de secretos y dibujando las criaturas de los cuentos de las viejitas. Pero no puede estar tranquilo; las órdenes golpeadas de los militares perturban sus paseos y sus pisadas a veces interrumpen su sueño. Además, le falta alguien, nadie habla de ella, pero el puesto vacío en la mesa confirma su ausencia. “Rocío ¿Dónde estás?” raya en la esquina de su cuaderno. Aunque nadie le ayude, buscará a su hermana en cada rincón del pueblo. Su búsqueda le llevará a descubrir que hay mucho más que se ha perdido en Kalkuhue. Se acerca la noche de San Juan y los susurros dicen que el olvido amenaza con cubrirlo todo ¿prevalecerá la memoria o esta será otra historia borrada en el tiempo?', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(534, 1, 'Ricardo', 'Rojas Henríquez', 'priestflame@gmail.com', 'Quelonic Games', 'Desarrollador, Director', 'Developer', 'Conseguir jugadores, Recibir feedback, Encontrar publisher, Conseguir cobertura de prensa, Conectar con otros desarrolladores', 'Financiamiento, Feedback de negocio, Feedback de producción', '¡Es el cumpleaños de Chumito, y la hora de llegada de los invitados se acerca! Ayuda a Chumito a dejar listos todos los preparativos de la fiesta junto a divertidos minijuegos mientras te dejas envolver por una historia profunda, emotiva y llena de giros argumentales.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(535, 1, 'Valentina', 'Reyes Brito', 'contact@badfocusgames.com', 'Bad Focus Games', 'Director', 'Developer', 'Conseguir wishlists, Conseguir jugadores, Recibir feedback, Encontrar publisher, Encontrar inversionistas, Conseguir cobertura de prensa, Conectar con otros desarrolladores, Promocionar un lanzamiento próximo', 'Publisher, Inversión, Marketing, Financiamiento, Feedback de producción', 'El jugador encarna a Remy, una pequeña ranita familiar de una bruja  ejecutada por la inquisición de autómatas. Su misión es recuperar el alma de su señora, atrapada en una bola de cristal, mediante un antiguo rito de resurrección que requiere la bendición de los cinco Guardianes de la Magia ocultos en un desolado mundo de fantasía.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(536, 1, 'Joseph', 'Lamartine', 'Undeadpudu@gmail.com', 'Undead Pudu', 'SoloDev', 'Developer', 'Conseguir jugadores, Recibir feedback', 'Feedback de producción, Feedback de la gente', 'Caes en una dimensión desconocida, donde el administrador del juego te hace firmar un contrato, el cual te encarcela en el mundo de GATE ¿podrás escapar?', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(537, 1, 'Renato', 'Vallejos', 'liftrockestudio@gmail.com', 'liftrock studio', 'Productor, Desarrollador', 'Developer', 'Recibir feedback, Conseguir cobertura de prensa', NULL, 'juego de plataformas y recoleccion que sigue la historia de BeepBug robot camuflado de abeja con una mision, restaurar el equilibrio en el ecosistema de los micromundos chilenos', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(538, 1, 'Yazmin', 'Martínez', 'Yazmin.martinez.munoz@gmail.com', 'Equipo: David Cabrera, Vicente Toledo y Yazmin Martínez.', 'Productor, Desarrollador, Director', 'Developer', 'Recibir feedback, Conectar con otros desarrolladores, Practica profesional', 'Feedback de producción, Practica profesional', 'A Bridge Too Dumb es un juego cooperativo online para hasta 4 jugadores, donde deben trabajar en equipo para construir una estructura y cruzar entre islas flotantes... antes de que se acabe el tiempo.\r\n\r\nTodo comienza en una isla llena de materiales de construcción. Los jugadores deben recogerlos, manipularlos con precisión y ensamblarlos para formar un puente que los lleve hasta la isla objetivo.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL);
INSERT INTO `usuarios` (`id`, `evento_id`, `nombre`, `apellido`, `correo`, `empresa`, `cargo`, `tipo_usuario`, `intereses`, `busca`, `descripcion`, `origen`, `luma_guest_id`, `telefono`, `luma_estado`, `luma_ticket`, `luma_checked_in_at`, `luma_qr_url`, `luma_created_at`, `created_at`, `updated_at`) VALUES
(539, 1, 'Jonathan', '', 'jonathan@drakkargames.com', 'Drakkar Game Studio', 'CEO, Desarrollador, Director', 'Developer', 'Conseguir wishlists, Recibir feedback, Conseguir cobertura de prensa, Conectar con otros desarrolladores, Promocionar un lanzamiento próximo', 'Marketing', 'Bladeforge: Ascension Crusade es un RPG táctico de fantasía oscura ambientado en Valtir, un mundo árido y desértico de inspiración persa/Medio Oriente. Tras un evento llamado el Resplandor, cada persona en el mundo recibe la misma visión: su anhelo más profundo hecho realidad. Se les dice que quien logre llegar primero al norte obtendrá el poder de imponer ese mundo perfecto sobre todos los demás. Como nadie sabe qué vio el otro, la confianza colapsa de inmediato, y el mundo entero se lanza a una guerra total por ser el único en llegar.\r\nA nivel de jugabilidad, es un táctico por turnos que reemplaza la estructura clásica de \"ronda por bando\" por un sistema de movimiento libre inspirado en el ajedrez: el jugador puede reposicionar varias unidades en una misma ronda para generar encierros sobre el enemigo, desencadenando combos cinemáticos coreografiados en tiempo real, con permadeath real y contra-juego (bloqueo, esquiva, reposicionamiento elemental) en cada golpe. Los personajes no tienen clases fijas: el jugador combina tipo de arma y elementos mágicos (Arcanix) para construir su propio estilo de combate, en un mundo sin héroes limpios ni villanos claros, donde cada facción (incluido el propio jugador) está dispuesta a todo a para imponer su propia visión del paraíso.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(540, 1, 'Melody', 'Geiger', 'melody@uwu.biz', 'Katapult Games', 'BizDev', 'Developer', 'Conseguir wishlists, Conseguir jugadores, Recibir feedback', 'Marketing', 'DUNK is a physics-based first-person basketball game. Team up with friends for casual or competitive matches. No auto-aim. Every play, good or terrible, is yours. Ready to make basketball physical?', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(541, 1, 'joaquin', 'araya araya', 'joaquin.araya@xerastudios.com', 'Xera studios', 'CEO, Desarrollador', 'Developer', 'Conseguir wishlists, Encontrar publisher', 'Publisher', 'Por el azar te viste al frente de el coleccionista y te robo las manos, ahora es tu turno de ir a enfrentarlo en un juego de PaRoKuuu, en donde jugaras el mitico piedra-papel-tijeras pero esta vez con cartas, deberas encontrar tu mejor jugada de piedra-papel-tijera, mientras que vas mejorando tu mazo entre las distintas dimensiones del coleccionista.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(542, 1, 'Ignacio', 'Soto', 'ignacio@spoonmangames.cl', 'Spoonman Games', 'Desarrollador, Director', 'Developer', 'Conseguir wishlists, Conseguir jugadores, Recibir feedback, Encontrar publisher, Encontrar inversionistas, Conseguir cobertura de prensa, Conectar con otros desarrolladores, Promocionar un lanzamiento próximo', 'Publisher, Inversión, Marketing, Financiamiento', 'Basado en un desierto de chatarra, ¡JTH! Una torre mágica lleva a este pequeño viajero a despejar su mente y hacer realidad su deseo.\r\nComo concepto puro, este videojuego pretende plasmar las ideas más extrañas o descabelladas que dibujaba personalmente en la última página del cuaderno cuando estaba en clase.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(543, 1, 'Ignacio', 'Soto', 'mekanicalvoid@gmail.com', 'Mekanical Void', 'Desarrollador, Director', 'Developer', 'Conseguir wishlists, Conseguir jugadores, Recibir feedback, Encontrar publisher, Encontrar inversionistas, Conseguir cobertura de prensa, Conectar con otros desarrolladores, Promocionar un lanzamiento próximo', 'Inversión, Marketing', 'Vin y Tara son dos hermanas que se ven obligadas a descubrir el misterio que rodea el universo, enfrentándose a la Top List que más allá de traerles una recompensa les presagiará un destino intrigante a manos de MOT.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(544, 1, 'Maureen', 'Berho', 'maureenberho@gmail.com', 'Niebla', 'CEO & Producer', 'Developer', NULL, NULL, NULL, 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL),
(545, 1, 'Nahir', 'Fajardo', 'nahir.f@dreamsofheaven-games.com', 'Dreams of Heaven Games', 'CEO y Productora', 'Developer', NULL, NULL, 'Juego de horror psicológico donde nuestra protagonista intenta encontrar desesperadamente a su hija quien desapareció en extrañas circunstancias.', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 20:18:32', NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `bloques_horarios`
--
ALTER TABLE `bloques_horarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_bloque_evento_inicio_fin` (`evento_id`,`inicio`,`fin`),
  ADD KEY `idx_bloques_inicio` (`inicio`);

--
-- Indices de la tabla `eventos`
--
ALTER TABLE `eventos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indices de la tabla `importaciones_luma`
--
ALTER TABLE `importaciones_luma`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evento_id` (`evento_id`);

--
-- Indices de la tabla `solicitudes_reunion`
--
ALTER TABLE `solicitudes_reunion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `solicitante_id` (`solicitante_id`),
  ADD KEY `receptor_id` (`receptor_id`),
  ADD KEY `idx_solicitudes_bloque_estado` (`bloque_horario_id`,`estado`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `correo` (`correo`),
  ADD KEY `idx_usuarios_evento` (`evento_id`),
  ADD KEY `idx_usuarios_origen` (`origen`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `bloques_horarios`
--
ALTER TABLE `bloques_horarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT de la tabla `eventos`
--
ALTER TABLE `eventos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=969;

--
-- AUTO_INCREMENT de la tabla `importaciones_luma`
--
ALTER TABLE `importaciones_luma`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `solicitudes_reunion`
--
ALTER TABLE `solicitudes_reunion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=548;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `bloques_horarios`
--
ALTER TABLE `bloques_horarios`
  ADD CONSTRAINT `bloques_horarios_ibfk_1` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `importaciones_luma`
--
ALTER TABLE `importaciones_luma`
  ADD CONSTRAINT `importaciones_luma_ibfk_1` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `solicitudes_reunion`
--
ALTER TABLE `solicitudes_reunion`
  ADD CONSTRAINT `solicitudes_reunion_ibfk_1` FOREIGN KEY (`solicitante_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `solicitudes_reunion_ibfk_2` FOREIGN KEY (`receptor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `solicitudes_reunion_ibfk_3` FOREIGN KEY (`bloque_horario_id`) REFERENCES `bloques_horarios` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
