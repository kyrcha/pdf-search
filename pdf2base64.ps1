$pdf = Get-Content 3.pdf -Encoding Byte
$base64 =[Convert]::ToBase64String($pdf)
$base64 | Out-File -FilePath out.txt