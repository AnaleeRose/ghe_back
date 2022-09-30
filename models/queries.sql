select 
matche.id match_id, 
matche.name match_name, 
matche.match_number match_number, 
matche.round round, 
matche.next_match_id next_match_id, 
team1.id team_1_id, 
team1.name team_1_name, 
team2.id team_2_id, 
team2.name team_2_name, 
circuit.total_rounds
FROM matches as matche
LEFT JOIN circuits as circuit ON matche.circuit_id = circuit.id
LEFT JOIN teams as team1 ON team1.id = matche.team_1_id
LEFT JOIN teams as team2 ON team2.id = matche.team_2_id
WHERE matche.circuit_id = 1;