//+------------------------------------------------------------------+
//|                                              TraderMind_Sync.mq5 |
//|                                  Copyright 2026, TraderMind Inc. |
//|                                          https://tradermind.io   |
//+------------------------------------------------------------------+
#property copyright   "TraderMind Inc."
#property link        "https://tradermind.io"
#property version     "1.00"
#property description "Automated real-time trade synchronization Expert Advisor for TraderMind."
#property description "Transmits closed deals, account balance, and equity via WebRequest to your private TraderMind behavioral dashboard."

//--- Inputs
input group "--- TraderMind Authentication ---"
input string   InpSyncKey            = "";                                // Private Sync Key (copy from /broker/connect)
input string   InpWebhookUrl         = "http://localhost:3000/api/broker/webhook"; // TraderMind Webhook URL

input group "--- Synchronization Settings ---"
input int      InpInitialSyncDays    = 60;                                // Initial History Sync (Days)
input int      InpHeartbeatSeconds   = 120;                               // Balance/Heartbeat Interval (Seconds)
input bool     InpVerboseLogging     = true;                              // Enable Verbose Logs in Experts tab

//--- Global Variables
datetime g_last_synced_deal_time = 0;
bool     g_initial_sync_done     = false;

//+------------------------------------------------------------------+
//| Helper: Format datetime to ISO 8601 string (UTC)                 |
//+------------------------------------------------------------------+
string FormatISODate(datetime dt)
{
   MqlDateTime mdt;
   TimeToStruct(dt, mdt);
   return StringFormat("%04d-%02d-%02dT%02d:%02d:%02dZ",
                       mdt.year, mdt.mon, mdt.day,
                       mdt.hour, mdt.min, mdt.sec);
}

//+------------------------------------------------------------------+
//| Helper: Send JSON Payload via WebRequest                         |
//+------------------------------------------------------------------+
bool SendPayload(string json_body)
{
   if(StringLen(InpSyncKey) == 0)
   {
      Print("TraderMind Sync Warning: InpSyncKey is empty! Please configure your sync key in EA inputs.");
      return false;
   }

   string headers = "Content-Type: application/json\r\nx-sync-key: " + InpSyncKey + "\r\n";
   char post_data[];
   char result_data[];
   string result_headers;
   int timeout = 5000;

   StringToCharArray(json_body, post_data, 0, WHOLE_ARRAY, CP_UTF8);
   ResetLastError();

   int res = WebRequest("POST", InpWebhookUrl, headers, timeout, post_data, result_data, result_headers);

   if(res == -1)
   {
      int err = GetLastError();
      if(err == 4060)
      {
         Print("========================================================================");
         Print("TraderMind WebRequest Error 4060: URL not allowed in MT5 settings!");
         Print("Please open MT5: Tools -> Options -> Expert Advisors");
         Print("Check 'Allow WebRequest for listed URL' and add: ", InpWebhookUrl);
         Print("========================================================================");
      }
      else
      {
         Print("TraderMind WebRequest failed. Error Code: ", err);
      }
      return false;
   }

   if(res >= 200 && res < 300)
   {
      string response_str = CharArrayToString(result_data, 0, WHOLE_ARRAY, CP_UTF8);
      if(InpVerboseLogging)
      {
         Print("TraderMind Sync Success (HTTP ", res, "): ", response_str);
      }
      return true;
   }
   else
   {
      string err_resp = CharArrayToString(result_data, 0, WHOLE_ARRAY, CP_UTF8);
      Print("TraderMind Server Error (HTTP ", res, "): ", err_resp);
      return false;
   }
}

//+------------------------------------------------------------------+
//| Sync Historical Deals (Initial load or periodic sweep)           |
//+------------------------------------------------------------------+
int SyncHistoricalDeals(int days_back)
{
   datetime from_time = TimeCurrent() - (days_back * 86400);
   datetime to_time   = TimeCurrent() + 60;

   if(!HistorySelect(from_time, to_time))
   {
      Print("TraderMind Error: Failed to select history from ", from_time);
      return 0;
   }

   int total_deals = HistoryDealsTotal();
   string trades_json = "";
   int count = 0;

   for(int i = 0; i < total_deals; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;

      long deal_entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      // Only process exit or reversal deals (closed trades)
      if(deal_entry != DEAL_ENTRY_OUT && deal_entry != DEAL_ENTRY_INOUT)
         continue;

      long deal_type = HistoryDealGetInteger(ticket, DEAL_TYPE);
      if(deal_type != DEAL_TYPE_BUY && deal_type != DEAL_TYPE_SELL)
         continue;

      string symbol     = HistoryDealGetString(ticket, DEAL_SYMBOL);
      double volume     = HistoryDealGetDouble(ticket, DEAL_VOLUME);
      double price      = HistoryDealGetDouble(ticket, DEAL_PRICE);
      double profit     = HistoryDealGetDouble(ticket, DEAL_PROFIT);
      double commission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
      double swap       = HistoryDealGetDouble(ticket, DEAL_SWAP);
      datetime time     = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);

      // Determine open direction from exit direction
      // If closing deal was SELL, position was BUY/LONG.
      string direction = (deal_type == DEAL_TYPE_SELL) ? "BUY" : "SELL";

      string trade_obj = StringFormat(
         "{\"ticket\":\"%d\",\"symbol\":\"%s\",\"type\":\"%s\",\"entry_price\":%.5f,\"lot_size\":%.2f,\"profit\":%.2f,\"commission\":%.2f,\"swap\":%.2f,\"open_time\":\"%s\",\"close_time\":\"%s\"}",
         ticket, symbol, direction, price, volume, profit, commission, swap,
         FormatISODate(time), FormatISODate(time)
      );

      if(count > 0) trades_json += ",";
      trades_json += trade_obj;
      count++;

      if(time > g_last_synced_deal_time)
         g_last_synced_deal_time = time;
   }

   // Prepare payload
   long   login    = AccountInfoInteger(ACCOUNT_LOGIN);
   string server   = AccountInfoString(ACCOUNT_SERVER);
   string currency = AccountInfoString(ACCOUNT_CURRENCY);
   double balance  = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity   = AccountInfoDouble(ACCOUNT_EQUITY);

   string payload = StringFormat(
      "{\"sync_key\":\"%s\",\"platform\":\"mt5\",\"account_login\":\"%d\",\"server\":\"%s\",\"currency\":\"%s\",\"balance\":%.2f,\"equity\":%.2f,\"trades\":[%s]}",
      InpSyncKey, login, server, currency, balance, equity, trades_json
   );

   if(SendPayload(payload))
   {
      if(InpVerboseLogging)
         PrintFormat("TraderMind: Successfully synced %d historical deals.", count);
      return count;
   }

   return 0;
}

//+------------------------------------------------------------------+
//| Sync Single Real-Time Deal                                       |
//+------------------------------------------------------------------+
void SyncSingleDeal(ulong deal_ticket)
{
   if(!HistoryDealSelect(deal_ticket)) return;

   long deal_type = HistoryDealGetInteger(deal_ticket, DEAL_TYPE);
   if(deal_type != DEAL_TYPE_BUY && deal_type != DEAL_TYPE_SELL) return;

   string symbol     = HistoryDealGetString(deal_ticket, DEAL_SYMBOL);
   double volume     = HistoryDealGetDouble(deal_ticket, DEAL_VOLUME);
   double price      = HistoryDealGetDouble(deal_ticket, DEAL_PRICE);
   double profit     = HistoryDealGetDouble(deal_ticket, DEAL_PROFIT);
   double commission = HistoryDealGetDouble(deal_ticket, DEAL_COMMISSION);
   double swap       = HistoryDealGetDouble(deal_ticket, DEAL_SWAP);
   datetime time     = (datetime)HistoryDealGetInteger(deal_ticket, DEAL_TIME);

   string direction = (deal_type == DEAL_TYPE_SELL) ? "BUY" : "SELL";

   string trade_obj = StringFormat(
      "{\"ticket\":\"%d\",\"symbol\":\"%s\",\"type\":\"%s\",\"entry_price\":%.5f,\"lot_size\":%.2f,\"profit\":%.2f,\"commission\":%.2f,\"swap\":%.2f,\"open_time\":\"%s\",\"close_time\":\"%s\"}",
      deal_ticket, symbol, direction, price, volume, profit, commission, swap,
      FormatISODate(time), FormatISODate(time)
   );

   long   login    = AccountInfoInteger(ACCOUNT_LOGIN);
   string server   = AccountInfoString(ACCOUNT_SERVER);
   string currency = AccountInfoString(ACCOUNT_CURRENCY);
   double balance  = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity   = AccountInfoDouble(ACCOUNT_EQUITY);

   string payload = StringFormat(
      "{\"sync_key\":\"%s\",\"platform\":\"mt5\",\"account_login\":\"%d\",\"server\":\"%s\",\"currency\":\"%s\",\"balance\":%.2f,\"equity\":%.2f,\"trades\":[%s]}",
      InpSyncKey, login, server, currency, balance, equity, trade_obj
   );

   SendPayload(payload);
}

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("-----------------------------------------------------------------");
   Print("TraderMind Sync EA initialized.");
   Print("Account: ", AccountInfoInteger(ACCOUNT_LOGIN), " | Server: ", AccountInfoString(ACCOUNT_SERVER));

   if(StringLen(InpSyncKey) == 0)
   {
      Alert("TraderMind Warning: InpSyncKey is empty! Please paste your Sync Key from TraderMind.");
   }
   else
   {
      // Run initial historical sync
      SyncHistoricalDeals(InpInitialSyncDays);
      g_initial_sync_done = true;
   }

   // Heartbeat timer for balance & offline sync sweeps
   EventSetTimer(InpHeartbeatSeconds);
   Print("-----------------------------------------------------------------");

   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("TraderMind Sync EA removed. Reason: ", reason);
}

//+------------------------------------------------------------------+
//| Real-time Trade Transaction Handler                              |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest &request,
                        const MqlTradeResult &result)
{
   // Intercept newly added closed deals
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD)
   {
      ulong deal_ticket = trans.deal;
      if(deal_ticket > 0 && HistoryDealSelect(deal_ticket))
      {
         long entry_type = HistoryDealGetInteger(deal_ticket, DEAL_ENTRY);
         // Deal closed or reversed
         if(entry_type == DEAL_ENTRY_OUT || entry_type == DEAL_ENTRY_INOUT)
         {
            if(InpVerboseLogging)
               Print("TraderMind: Real-time closed deal detected! Ticket: ", deal_ticket);
            SyncSingleDeal(deal_ticket);
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Timer function (Heartbeat & sweeps)                              |
//+------------------------------------------------------------------+
void OnTimer()
{
   // Sweep for any closed trades in the last 2 days (failsafe) and update balance/equity
   SyncHistoricalDeals(2);
}
//+------------------------------------------------------------------+
