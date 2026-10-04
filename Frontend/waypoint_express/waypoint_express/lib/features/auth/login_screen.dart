import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/config/app_config.dart';
import '../../core/offline/connectivity_service.dart';
import '../../shared/theme/app_theme.dart';
import '../../shared/widgets/mobile_scaffold.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController(text: AppConfig.devDriverUsername);
  final _passwordController = TextEditingController(text: AppConfig.devPassword);
  bool _obscurePassword = true;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _fillDriver() {
    setState(() {
      _usernameController.text = AppConfig.devDriverUsername;
      _passwordController.text = AppConfig.devPassword;
    });
  }

  void _fillLoader() {
    setState(() {
      _usernameController.text = AppConfig.devLoaderUsername;
      _passwordController.text = AppConfig.devPassword;
    });
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final success = await ref.read(authControllerProvider.notifier).login(
          _usernameController.text,
          _passwordController.text,
        );

    if (success && mounted) {
      final auth = ref.read(authControllerProvider);
      if (auth.isDriver) {
        context.go('/driver');
      } else if (auth.isLoader) {
        context.go('/loader');
      }
    }
  }

  void _showServerConfigDialog() {
    final urlController = TextEditingController(text: AppConfig.activeBaseUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('API & Network Config'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Base URL (Mock or Real Backend):',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: urlController,
              decoration: const InputDecoration(
                hintText: 'e.g. http://localhost:8000/api/v1',
                isDense: true,
              ),
            ),
            const SizedBox(height: 16),
            Consumer(
              builder: (context, ref, _) {
                final net = ref.watch(connectivityServiceProvider);
                return SwitchListTile(
                  title: const Text('Simulate Offline Mode'),
                  subtitle: const Text('Force offline execution for testing/demo'),
                  value: net.isSimulatedOffline,
                  contentPadding: EdgeInsets.zero,
                  onChanged: (val) {
                    ref.read(connectivityServiceProvider.notifier).toggleSimulatedOffline(val);
                  },
                );
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              AppConfig.activeBaseUrl = urlController.text.trim();
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Base URL set to: ${AppConfig.activeBaseUrl}')),
              );
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);

    return MobileScaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 20),
                // Logo & Header
                Center(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryLight,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Image.asset(
                      'assets/images/logo2.png',
                      height: 56,
                      width: 56,
                      errorBuilder: (_, __, ___) => const Icon(
                        Icons.local_shipping,
                        size: 48,
                        color: AppTheme.primaryTeal,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Center(
                  child: Text(
                    'Waypoint Express',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryDark,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                const Center(
                  child: Text(
                    'Field Operations (Driver & Loader)',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                // Error Banner if present
                if (authState.errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.errorRed.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.errorRed.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: AppTheme.errorRed, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            authState.errorMessage!,
                            style: const TextStyle(
                              color: AppTheme.errorRed,
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],

                // Username field
                TextFormField(
                  controller: _usernameController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Username / Email',
                    hintText: 'e.g. driver@waypoint.test',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter your username';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Password field
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    hintText: '••••••••',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off : Icons.visibility,
                        color: AppTheme.textSecondary,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your password';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),

                // Sign in Button
                ElevatedButton(
                  onPressed: authState.isLoading ? null : _handleLogin,
                  child: authState.isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text('Sign In'),
                ),
                const SizedBox(height: 32),

                // Debug Quick-Fill Section
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceVariant,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.bolt, size: 16, color: AppTheme.primaryTeal),
                          SizedBox(width: 4),
                          Text(
                            'Quick Dev Fill',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textSecondary,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _fillDriver,
                              icon: const Icon(Icons.drive_eta, size: 16),
                              label: const Text('Driver'),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                textStyle: const TextStyle(fontSize: 13),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _fillLoader,
                              icon: const Icon(Icons.warehouse, size: 16),
                              label: const Text('Loader'),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                textStyle: const TextStyle(fontSize: 13),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      TextButton.icon(
                        onPressed: _showServerConfigDialog,
                        icon: const Icon(Icons.settings, size: 16),
                        label: const Text(
                          'Configure API Server & Offline Simulation',
                          style: TextStyle(fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
