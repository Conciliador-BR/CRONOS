-- Fundo do quadro e capa da lista aceitam os mesmos formatos das fotos de cartão
-- (o servidor valida com CARD_IMAGE_MIME_TYPES). SVG continua de fora.
update storage.buckets
set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'image/bmp']
where id = 'wallpapers';
