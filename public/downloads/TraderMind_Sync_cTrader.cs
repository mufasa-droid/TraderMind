//+------------------------------------------------------------------+
//|                                       TraderMind_Sync_cTrader.cs |
//|                                  Copyright 2026, TraderMind Inc. |
//|                                          https://tradermind.io   |
//+------------------------------------------------------------------+
// Instructions:
// 1. In cTrader Desktop, go to the "Automate" tab on the left navigation bar.
// 2. Click "New cBot", paste this entire C# file, and click "Build" (Ctrl + B).
// 3. Right-click the built cBot -> "Add an Instance" to any symbol/chart.
// 4. In the parameters panel, paste your Private Sync Key from /broker/connect.
// 5. Click the green Play/Start button.
//+------------------------------------------------------------------+

using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Net;
using System.Text;
using cAlgo.API;
using cAlgo.API.Internals;

namespace cAlgo.Robots
{
    [Robot(TimeZone = TimeZones.UTC, AccessRights = AccessRights.FullAccess)]
    public class TraderMind_Sync : Robot
    {
        [Parameter("Private Sync Key", Group = "TraderMind Authentication", DefaultValue = "")]
        public string SyncKey { get; set; }

        [Parameter("Webhook URL", Group = "TraderMind Authentication", DefaultValue = "http://localhost:3000/api/broker/webhook")]
        public string WebhookUrl { get; set; }

        [Parameter("Initial History Sweep (Days)", Group = "Synchronization Settings", DefaultValue = 60)]
        public int HistoryDays { get; set; }

        [Parameter("Heartbeat Interval (Seconds)", Group = "Synchronization Settings", DefaultValue = 60)]
        public int HeartbeatSeconds { get; set; }

        [Parameter("Verbose Logging", Group = "Synchronization Settings", DefaultValue = true)]
        public bool VerboseLogging { get; set; }

        private readonly HashSet<long> _syncedPositionIds = new HashSet<long>();

        protected override void OnStart()
        {
            Print("[TraderMind] Initializing cTrader Live Sync Robot v1.00...");

            if (string.IsNullOrWhiteSpace(SyncKey))
            {
                Print("[TraderMind ERROR] SyncKey is empty! Please configure your Private Sync Key in the cBot parameters.");
                return;
            }

            // Subscribe to position closure events for real-time live streaming
            Positions.Closed += OnPositionsClosed;

            // Perform initial historical sweep from closed positions
            SyncHistoricalDeals();

            // Start periodic heartbeat for balance & equity telemetry
            int interval = Math.Max(15, HeartbeatSeconds);
            Timer.Start(TimeSpan.FromSeconds(interval));

            Print("[TraderMind] cTrader Live Sync successfully connected. Listening for closed deals...");
        }

        private void OnPositionsClosed(PositionClosedEventArgs args)
        {
            try
            {
                var pos = args.Position;
                if (pos == null) return;

                if (VerboseLogging)
                {
                    Print($"[TraderMind] Live Deal Closure Event: #{pos.Id} {pos.SymbolName} {pos.TradeType} Net: {pos.NetProfit:F2} {Account.Currency}");
                }

                _syncedPositionIds.Add(pos.Id);

                string dealJson = BuildDealJson(
                    ticket: pos.Id,
                    symbol: pos.SymbolName,
                    tradeType: pos.TradeType.ToString().ToUpperInvariant(),
                    volume: pos.Quantity,
                    openPrice: pos.EntryPrice,
                    closePrice: pos.ClosingPrice,
                    profit: pos.GrossProfit,
                    commission: pos.Commissions * 2, // Round-turn equivalent
                    swap: pos.Swap,
                    openTime: pos.EntryTime,
                    closeTime: pos.ClosingTime ?? DateTime.UtcNow,
                    stopLoss: pos.StopLoss,
                    takeProfit: pos.TakeProfit
                );

                string payload = string.Format(CultureInfo.InvariantCulture,
                    "{{" +
                    "\"sync_key\":\"{0}\"," +
                    "\"platform\":\"ctrader\"," +
                    "\"account_login\":\"{1}\"," +
                    "\"server\":\"{2}\"," +
                    "\"currency\":\"{3}\"," +
                    "\"balance\":{4:F2}," +
                    "\"equity\":{5:F2}," +
                    "\"trades\":[{6}]" +
                    "}}",
                    EscapeJson(SyncKey),
                    Account.Number,
                    EscapeJson(Account.BrokerName ?? "cTrader Broker"),
                    Account.Currency,
                    Account.Balance,
                    Account.Equity,
                    dealJson
                );

                bool ok = PostJson(payload);
                if (ok && VerboseLogging)
                {
                    Print($"[TraderMind] Successfully streamed live deal #{pos.Id} to dashboard.");
                }
            }
            catch (Exception ex)
            {
                Print($"[TraderMind ERROR] Exception in OnPositionsClosed: {ex.Message}");
            }
        }

        protected override void OnTimer()
        {
            SendHeartbeat();
        }

        protected override void OnStop()
        {
            Positions.Closed -= OnPositionsClosed;
            Timer.Stop();
            Print("[TraderMind] cTrader Live Sync Robot stopped.");
        }

        private void SyncHistoricalDeals()
        {
            try
            {
                DateTime cutoff = DateTime.UtcNow.AddDays(-Math.Abs(HistoryDays));
                var historyTrades = History.FindAll(null, null, cutoff, DateTime.UtcNow);

                if (historyTrades == null || historyTrades.Length == 0)
                {
                    Print("[TraderMind] No historical deals found within the requested sweep window.");
                    SendHeartbeat();
                    return;
                }

                Print($"[TraderMind] Sweeping {historyTrades.Length} historical deals since {cutoff:yyyy-MM-dd}...");

                var dealsList = new List<string>();
                foreach (var h in historyTrades)
                {
                    _syncedPositionIds.Add(h.PositionId);

                    string dealJson = BuildDealJson(
                        ticket: h.PositionId,
                        symbol: h.SymbolName,
                        tradeType: h.TradeType.ToString().ToUpperInvariant(),
                        volume: h.VolumeInUnits,
                        openPrice: h.EntryPrice,
                        closePrice: h.ClosingPrice,
                        profit: h.GrossProfit,
                        commission: h.Commissions,
                        swap: h.Swap,
                        openTime: h.EntryTime,
                        closeTime: h.ClosingTime,
                        stopLoss: null,
                        takeProfit: null
                    );
                    dealsList.Add(dealJson);
                }

                string payload = string.Format(CultureInfo.InvariantCulture,
                    "{{" +
                    "\"sync_key\":\"{0}\"," +
                    "\"platform\":\"ctrader\"," +
                    "\"account_login\":\"{1}\"," +
                    "\"server\":\"{2}\"," +
                    "\"currency\":\"{3}\"," +
                    "\"balance\":{4:F2}," +
                    "\"equity\":{5:F2}," +
                    "\"trades\":[{6}]" +
                    "}}",
                    EscapeJson(SyncKey),
                    Account.Number,
                    EscapeJson(Account.BrokerName ?? "cTrader Broker"),
                    Account.Currency,
                    Account.Balance,
                    Account.Equity,
                    string.Join(",", dealsList)
                );

                bool success = PostJson(payload);
                if (success)
                {
                    Print($"[TraderMind] Initial sweep complete. Successfully synced {dealsList.Count} historical deals.");
                }
            }
            catch (Exception ex)
            {
                Print($"[TraderMind ERROR] Exception during historical sweep: {ex.Message}");
            }
        }

        private void SendHeartbeat()
        {
            try
            {
                string payload = string.Format(CultureInfo.InvariantCulture,
                    "{{" +
                    "\"sync_key\":\"{0}\"," +
                    "\"platform\":\"ctrader\"," +
                    "\"account_login\":\"{1}\"," +
                    "\"server\":\"{2}\"," +
                    "\"currency\":\"{3}\"," +
                    "\"balance\":{4:F2}," +
                    "\"equity\":{5:F2}," +
                    "\"heartbeat\":true" +
                    "}}",
                    EscapeJson(SyncKey),
                    Account.Number,
                    EscapeJson(Account.BrokerName ?? "cTrader Broker"),
                    Account.Currency,
                    Account.Balance,
                    Account.Equity
                );

                PostJson(payload);
            }
            catch (Exception ex)
            {
                if (VerboseLogging) Print($"[TraderMind WARNING] Heartbeat failed: {ex.Message}");
            }
        }

        private string BuildDealJson(
            long ticket,
            string symbol,
            string tradeType,
            double volume,
            double openPrice,
            double closePrice,
            double profit,
            double commission,
            double swap,
            DateTime openTime,
            DateTime closeTime,
            double? stopLoss,
            double? takeProfit)
        {
            string sl = stopLoss.HasValue ? string.Format(CultureInfo.InvariantCulture, "{0:F5}", stopLoss.Value) : "null";
            string tp = takeProfit.HasValue ? string.Format(CultureInfo.InvariantCulture, "{0:F5}", takeProfit.Value) : "null";

            return string.Format(CultureInfo.InvariantCulture,
                "{{" +
                "\"ticket\":{0}," +
                "\"symbol\":\"{1}\"," +
                "\"type\":\"{2}\"," +
                "\"volume\":{3:F2}," +
                "\"open_price\":{4:F5}," +
                "\"exit_price\":{5:F5}," +
                "\"profit\":{6:F2}," +
                "\"commission\":{7:F2}," +
                "\"swap\":{8:F2}," +
                "\"open_time\":\"{9:yyyy-MM-ddTHH:mm:ssZ}\"," +
                "\"close_time\":\"{10:yyyy-MM-ddTHH:mm:ssZ}\"," +
                "\"stop_loss\":{11}," +
                "\"take_profit\":{12}" +
                "}}",
                ticket,
                EscapeJson(symbol),
                tradeType,
                volume,
                openPrice,
                closePrice,
                profit,
                commission,
                swap,
                openTime.ToUniversalTime(),
                closeTime.ToUniversalTime(),
                sl,
                tp
            );
        }

        private bool PostJson(string jsonBody)
        {
            if (string.IsNullOrWhiteSpace(WebhookUrl))
            {
                Print("[TraderMind ERROR] WebhookUrl is empty.");
                return false;
            }

            try
            {
                var request = (HttpWebRequest)WebRequest.Create(WebhookUrl);
                request.Method = "POST";
                request.ContentType = "application/json";
                request.Headers.Add("x-sync-key", SyncKey);
                request.Timeout = 8000;

                byte[] data = Encoding.UTF8.GetBytes(jsonBody);
                request.ContentLength = data.Length;

                using (var stream = request.GetRequestStream())
                {
                    stream.Write(data, 0, data.Length);
                }

                using (var response = (HttpWebResponse)request.GetResponse())
                {
                    return response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.Created;
                }
            }
            catch (WebException wex)
            {
                if (wex.Response is HttpWebResponse errResponse)
                {
                    using (var reader = new StreamReader(errResponse.GetResponseStream()))
                    {
                        string errBody = reader.ReadToEnd();
                        Print($"[TraderMind ERROR] Server responded with HTTP {(int)errResponse.StatusCode}: {errBody}");
                    }
                }
                else
                {
                    Print($"[TraderMind ERROR] Network error posting to {WebhookUrl}: {wex.Message}");
                }
                return false;
            }
            catch (Exception ex)
            {
                Print($"[TraderMind ERROR] Unexpected error: {ex.Message}");
                return false;
            }
        }

        private static string EscapeJson(string s)
        {
            if (string.IsNullOrEmpty(s)) return "";
            return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", "").Replace("\n", " ");
        }
    }
}
