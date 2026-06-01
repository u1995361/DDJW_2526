#!/usr/bin/php-cgi
<?php
    $to_ret = new stdClass();
    $to_ret->error = false;
    try {
        $connexio = oci_connect('*********', '*********', 'ORCLCDB');

        $consulta="SELECT * FROM Saves LIMIT 1 ORDER BY id DESC";
        $comanda = oci_parse($connexio, $consulta);
        if (oci_execute($comanda) && $row = oci_fetch_array($comanda, OCI_ASSOC)){
            $obj = new stdClass();
            $obj->items = json_decode($row["items"]);
            $obj->states = json_decode($row["states"]);
            $obj->lastCard = $row["lastCard"];
            $obj->score = $row["score"];
            $obj->pairs = $row["pairs"];
            $to_ret->save = $obj;
        }
        else $to_ret->error = true;
    } catch (Exception $e) {
        $to_ret->error = true;
    }
    echo json_encode($to_ret);
?>