from django.urls import path
from . import views

urlpatterns = [
    path('accounts/', views.get_plaid_accounts, name='get-plaid-accounts'),
    path('accounts/<int:account_id>/disconnect/', views.disconnect_account, name='disconnect-account'),
    path('create-link-token/', views.create_link_token, name='create-link-token'),
    path('exchange-token/', views.exchange_token, name='exchange-token'),
    path('sync-transactions/', views.sync_transactions, name='sync-transactions'),
    path('convert-transactions/', views.convert_plaid_transactions, name='convert-plaid-transactions'),
]