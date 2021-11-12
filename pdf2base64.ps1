# script to convert a pdf to base64 encoding
$pdf = Get-Content .\test_pdfs\sample.pdf -Encoding Byte
$base64 =[Convert]::ToBase64String($pdf)
$base64 | Out-File -FilePath out.txt