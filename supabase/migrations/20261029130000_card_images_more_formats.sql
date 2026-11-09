-- Fotos de cartão aceitam mais formatos de imagem exibíveis no navegador (GIF, AVIF, BMP).
-- SVG continua de fora: pode carregar script ao ser aberto pela URL assinada.
update storage.buckets
set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'image/bmp']
where id = 'card-images';
