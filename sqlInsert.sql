INSERT INTO `application` (`id`, `trainingId`, `playerName`, `playerPhone`, `playerComment`, `date`, `createdAt`) VALUES
(2, 3, 'Yaromir Kravtsov', '+49111111', 'playerComment playerComment playerComment', '2024-10-07 09:00:00', '2024-10-28 23:07:32'),
(3, 3, 'Yaromir Kravtsov', '+49111111', 'playerComment playerComment playerComment', '2024-10-08 09:00:00', '2024-10-28 23:17:49');


INSERT INTO `group` (`id`, `groupName`, `groupUrl`, `color`) VALUES
(2, 'Kinder 1+', 'https://example.com/kinder-1-plus', '#FF5733'),
(3, 'Kinder 5+', 'https://example.com/kinder-5-plus', '#33FF57'),
(4, 'Junior', 'https://example.com/junior', '#3357FF'),
(5, 'Erwachsene', 'https://example.com/erwachsene', '#FF33A6');


INSERT INTO `location` (`id`, `locationName`, `locationUrl`) VALUES
(1, 'Main Hall', 'https://example.com/main-hall'),
(2, 'Outdoor Field', 'https://example.com/outdoor-field'),
(3, 'Gym Room A', 'https://example.com/gym-room-a'),
(4, 'Conference Room', 'https://example.com/conference-room');


INSERT INTO `token` (`id`, `refreshToken`, `creationDate`, `deviceId`, `userId`) VALUES
(1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJ1c2VyIiwidXNlcm5hbWUiOiJhZG1pbiIsImlhdCI6MTczMDExNjA4NywiZXhwIjoxNzMyNzA4MDg3fQ.4b4af-ymBZKSAuQQcCCjVXX-I1UG6bg2UCLipFFXErM', '2024-10-28 11:48:07', '784432be13d65dde5742', 1),
(2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJ1c2VyIiwidXNlcm5hbWUiOiJhZG1pbiIsImlhdCI6MTczMDExODI0OSwiZXhwIjoxNzMyNzEwMjQ5fQ.C1erVYzDLggmvatEJUoq_8Kj2P9if6l85LUlm9HV2G0', '2024-10-28 12:24:09', 'e6643a62742de8a490b7', 1),
(3, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJ1c2VyIiwidXNlcm5hbWUiOiJhZG1pbiIsImlhdCI6MTczMDExODYwMSwiZXhwIjoxNzMyNzEwNjAxfQ.zZXZUNzH7pXuXIipxwmoKGP1luY6UISp40RVKc6N8Zo', '2024-10-28 12:30:01', '177668c29bfbd36961cc', 1),
(4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJhZG1pbiIsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3MzAxMTg3MTYsImV4cCI6MTczMjcxMDcxNn0.iE8z3676KhLNNdHun4Bctpilb5_wqtyPGmsOd0rE_Hg', '2024-10-28 12:31:56', 'e1e2a7fc85dfb2f50c5a', 1);



INSERT INTO `user` (`id`, `username`, `password`, `role`) VALUES
(1, 'admin', '$2b$04$4UzsCuVUiaAgeQ5uefQpb.1xKoSPNFkc0kKsrkaXJrm.N.4mfapV.', 'admin');

INSERT INTO `training` (`id`, `isTrail`, `startTime`, `endTime`, `repeatType`, `groupId`, `locationId`) VALUES
(1, 1, '2024-10-28 09:00:00', '2024-10-28 11:00:00', 2, 2, 3),
(3, 1, '2024-10-07 09:00:00', '2024-10-07 11:00:00', 2, 3, 2);