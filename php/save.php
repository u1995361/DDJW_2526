#!/usr/bin/php-cgi
<?php
    $to_ret = true;
    try {
        $_POST = json_decode(file_get_contents('php://input', true));
        $items = json_encode($_POST->items);
        $states = json_encode($_POST->states);

        $connexio = oci_connect('*********', '*********', 'ORCLCDB');

        $consulta="SELECT CASE COUNT(*) WHEN 0 THEN 0 ELSE MAX(id)+1 END FROM Saves";
        $comanda = oci_parse($connexio, $consulta);
        if (oci_execute($comanda) && $row = oci_fetch_array($comanda, OCI_NUM)){
            $id = $row[0];
            $consulta="INSERT INTO Saves VALUES (:id, :items, :states, :lastCard, :score, :pairs)";
            $comanda = oci_parse($connexio, $consulta);
            oci_bind_by_name($comanda,":id",$id);
            oci_bind_by_name($comanda,":items",$items);
            oci_bind_by_name($comanda,":states",$states);
            oci_bind_by_name($comanda,":lastCard",$_POST->lastCard);
            oci_bind_by_name($comanda,":score",$_POST->score);
            oci_bind_by_name($comanda,":pairs",$_POST->pairs);
            oci_execute($comanda);
        }
        else{
            $to_ret = false;
        }
        
    } catch (Exception $e) {
        $to_ret = false;
    }
    echo json_encode($to_ret);
?>