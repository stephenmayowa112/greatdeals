from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone

class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('slug', models.SlugField(blank=True, max_length=120, unique=True)),
                ('description', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name_plural': 'Categories',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Deal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(db_index=True, max_length=255)),
                ('short_description', models.TextField()),
                ('image', models.ImageField(blank=True, null=True, upload_to='deals/%Y/%m/')),
                ('image_url', models.URLField(blank=True, help_text='External image CDN or backup URL', max_length=500, null=True)),
                ('original_price', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('discounted_price', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('percentage_off', models.PositiveIntegerField(blank=True, help_text='Discount percentage off', null=True)),
                ('source_name', models.CharField(help_text='E.g. Amazon, Best Buy, Nike', max_length=100)),
                ('source_url', models.URLField(help_text='Outbound link to retailer checkout/product page', max_length=1000)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('live', 'Live'), ('expired', 'Expired')], db_index=True, default='live', max_length=10)),
                ('posted_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                ('expires_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='deals', to='deals.category')),
            ],
            options={
                'ordering': ['-posted_at', '-id'],
                'indexes': [
                    models.Index(fields=['status', '-posted_at'], name='deals_deal_status_posted_idx'),
                    models.Index(fields=['category', 'status'], name='deals_deal_cat_status_idx'),
                    models.Index(fields=['expires_at'], name='deals_deal_expires_idx'),
                ],
            },
        ),
    ]
